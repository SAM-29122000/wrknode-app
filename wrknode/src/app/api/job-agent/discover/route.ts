import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/jobAgent/cronAuth";
import { isWithinDiscoveryWindow } from "@/lib/jobAgent/activeWindow";
import { fetchAllListings, type RawJobListing } from "@/lib/jobAgent/jobSources";
import { draftApplicationEmail, scoreJobMatch } from "@/lib/jobAgent/ai";
import { selectResumeVariant } from "@/lib/jobAgent/selectResumeVariant";
import { sendWhatsApp } from "@/lib/jobAgent/whatsapp";

const MATCH_THRESHOLD = 70;

// Netlify kills this function at maxDuration — and does so hard: a
// mid-flight kill returns a non-JSON response that this route's own
// try/catch can never see or report. Confirmed live: with a cap of 15,
// only 7 finished (visible via their DB writes) before the whole request
// died with no error body. Each listing needs 1-2 sequential AI calls
// (~3-5s each, more with a 503 retry), so the batch has to be small
// enough to finish comfortably inside the limit even when a few calls
// need retries — not sized for the best case. Unprocessed listings are
// never marked "seen", so they simply surface again next run; nothing is
// silently dropped, just deferred.
const MAX_LISTINGS_PER_RUN = 6;
const CONCURRENCY = 3;
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

async function processListing(listing: RawJobListing): Promise<"queued" | "scored_low" | "failed"> {
  try {
    return await processListingInner(listing);
  } catch (err) {
    // One listing failing (e.g. a Gemini call that exhausted its retries)
    // must not take down the other 14 in this batch — it's simply left
    // un-marked-seen, so it surfaces again on the next run.
    console.error(`Failed to process listing ${listing.sourceId}:`, err);
    return "failed";
  }
}

async function processListingInner(listing: RawJobListing) {
  const { score, reasoning, suggested_emphasis } = await scoreJobMatch(listing);

  if (score >= MATCH_THRESHOLD) {
    const draftEmail = await draftApplicationEmail(listing, suggested_emphasis);
    const resumeVariant = selectResumeVariant(suggested_emphasis);

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
        resumeVariant,
        draftEmail,
        status: "PENDING",
      },
    });

    await sendWhatsApp(
      `New job match (${score}%): ${lead.title} at ${lead.company ?? "unknown company"} (${lead.location ?? "location unknown"}). Source: ${lead.source}. Resume: ${resumeVariant}.\nReply APPLY-${lead.id} to send, or SKIP-${lead.id} to skip.\nLink: ${lead.url}`
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

  // Wrapped so a failure anywhere below returns the real error instead of
  // an opaque 500 with an empty body — this route is only reachable by an
  // admin session or the cron secret, so surfacing the message/stack here
  // isn't exposing anything to the public.
  try {
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
    const failed = outcomes.filter((o) => o === "failed").length;

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
      failed,
    });
  } catch (err) {
    console.error("discover route failed:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}
