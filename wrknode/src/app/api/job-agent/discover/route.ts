import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/jobAgent/cronAuth";
import { isWithinDiscoveryWindow } from "@/lib/jobAgent/activeWindow";
import { fetchAllListings, type RawJobListing } from "@/lib/jobAgent/jobSources";
import { draftApplicationEmail, scoreJobMatch } from "@/lib/jobAgent/ai";
import { sendWhatsApp } from "@/lib/jobAgent/whatsapp";

const MATCH_THRESHOLD = 70;

// Netlify kills this function at maxDuration. Each listing needs 1-2
// sequential AI calls (~3-5s each), so a naive one-at-a-time loop over
// even a modest batch of genuinely-new listings can blow past 60s (an
// 18-listing local test took 120s). Two mitigations: only take the AI
// calls for the top N new listings per run (the rest surface on the next
// run — they're never marked "seen" until actually processed, so nothing
// is silently dropped) and run those N with limited concurrency.
const MAX_LISTINGS_PER_RUN = 15;
const CONCURRENCY = 5;
export const maxDuration = 60;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function processListing(listing: RawJobListing) {
  const { score, reasoning, suggested_emphasis } = await scoreJobMatch(listing);

  if (score >= MATCH_THRESHOLD) {
    const draftEmail = await draftApplicationEmail(listing, suggested_emphasis);

    const lead = await prisma.jobLead.create({
      data: {
        source: listing.source,
        sourceId: listing.sourceId,
        title: listing.title,
        company: listing.company,
        location: listing.location,
        description: listing.description,
        url: listing.url,
        matchScore: score,
        reasoning,
        emphasis: suggested_emphasis,
        draftEmail,
        status: "PENDING",
      },
    });

    await sendWhatsApp(
      `New job match (${score}%): ${lead.title} at ${lead.company ?? "unknown company"} (${lead.location ?? "location unknown"}). Source: ${lead.source}.\nReply APPLY-${lead.id} to send, or SKIP-${lead.id} to skip.\nLink: ${lead.url}`
    );
    return "queued" as const;
  }

  await prisma.jobLead.create({
    data: {
      source: listing.source,
      sourceId: listing.sourceId,
      title: listing.title,
      company: listing.company,
      location: listing.location,
      description: listing.description,
      url: listing.url,
      matchScore: score,
      reasoning,
      status: "SCORED_LOW",
    },
  });
  return "scored_low" as const;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin && !isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  // An admin manually clicking "Run discovery now" should always work,
  // even outside the window, for testing. The scheduled/cron path
  // respects the 8am-12pm window.
  if (!isAdmin && !isWithinDiscoveryWindow()) {
    return NextResponse.json({ ok: true, skipped: "outside discovery window" });
  }

  const listings = await fetchAllListings();

  const existingIds = new Set(
    (
      await prisma.jobLead.findMany({
        where: { sourceId: { in: listings.map((l) => l.sourceId) } },
        select: { sourceId: true },
      })
    ).map((l) => l.sourceId)
  );

  const newListings = listings.filter((l) => !existingIds.has(l.sourceId)).slice(0, MAX_LISTINGS_PER_RUN);

  const outcomes = await mapWithConcurrency(newListings, CONCURRENCY, processListing);
  const queued = outcomes.filter((o) => o === "queued").length;

  if (queued > 0) {
    await sendWhatsApp(
      `Discovery run: checked ${listings.length} listings, scored ${newListings.length} new ones, ${queued} queued for your approval above.`
    );
  }

  return NextResponse.json({
    ok: true,
    fetched: listings.length,
    newFound: listings.length - existingIds.size,
    scoredThisRun: newListings.length,
    queued,
  });
}
