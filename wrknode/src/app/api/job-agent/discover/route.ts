import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/jobAgent/cronAuth";
import { fetchAllListings } from "@/lib/jobAgent/jobSources";
import { draftApplicationEmail, scoreJobMatch } from "@/lib/jobAgent/ai";
import { sendWhatsApp } from "@/lib/jobAgent/whatsapp";

const MATCH_THRESHOLD = 70;

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin && !isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const listings = await fetchAllListings();
  let scored = 0;
  let queued = 0;

  for (const listing of listings) {
    const existing = await prisma.jobLead.findUnique({ where: { sourceId: listing.sourceId } });
    if (existing) continue;

    const { score, reasoning, suggested_emphasis } = await scoreJobMatch(listing);
    scored++;

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
      queued++;
    } else {
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
    }
  }

  return NextResponse.json({ ok: true, fetched: listings.length, scored, queued });
}
