import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/jobAgent/cronAuth";
import { sendWhatsApp } from "@/lib/jobAgent/whatsapp";

export const maxDuration = 30;

function startOfTodayIST(): Date {
  // en-CA gives YYYY-MM-DD, which parses back unambiguously.
  const istDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  // IST is UTC+5:30 with no DST, so midnight IST is always 18:30 UTC the previous day.
  return new Date(`${istDateStr}T00:00:00+05:30`);
}

function formatIST(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin && !isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const since = startOfTodayIST();

  const [todaysLeads, todaysReplies] = await Promise.all([
    prisma.jobLead.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "asc" } }),
    prisma.jobReplyLog.findMany({
      where: { detectedAt: { gte: since }, category: { not: "not_job_related" } },
      orderBy: { detectedAt: "asc" },
    }),
  ]);

  const sent = todaysLeads.filter((l) => l.status === "SENT");
  const pending = todaysLeads.filter((l) => l.status === "PENDING");
  const skipped = todaysLeads.filter((l) => l.status === "SKIPPED");
  const scoredLow = todaysLeads.filter((l) => l.status === "SCORED_LOW");
  const byPlatform = todaysLeads.reduce<Record<string, number>>((acc, l) => {
    acc[l.source] = (acc[l.source] ?? 0) + 1;
    return acc;
  }, {});

  const lines: string[] = [];
  lines.push(`Today's job agent summary (as of ${formatIST(new Date())} IST):`);
  lines.push(
    `Discovered ${todaysLeads.length} new listings (${Object.entries(byPlatform)
      .map(([platform, count]) => `${platform}: ${count}`)
      .join(", ") || "none"}).`
  );
  lines.push(
    `${sent.length} applied, ${pending.length} awaiting your reply, ${skipped.length} skipped, ${scoredLow.length} didn't meet the match bar.`
  );

  if (sent.length > 0) {
    lines.push("");
    lines.push("Applied:");
    for (const lead of sent) {
      lines.push(`- ${formatIST(lead.updatedAt)}: ${lead.title} at ${lead.company ?? "unknown"} (${lead.source})`);
    }
  }

  if (todaysReplies.length > 0) {
    lines.push("");
    lines.push(`${todaysReplies.length} reply/replies today:`);
    for (const reply of todaysReplies) {
      lines.push(`- [${reply.category}] ${reply.summary} (from ${reply.fromAddress})`);
    }
  } else {
    lines.push("");
    lines.push("No replies yet today.");
  }

  const message = lines.join("\n");
  await sendWhatsApp(message);

  return NextResponse.json({
    ok: true,
    discovered: todaysLeads.length,
    sent: sent.length,
    pending: pending.length,
    skipped: skipped.length,
    scoredLow: scoredLow.length,
    replies: todaysReplies.length,
  });
}
