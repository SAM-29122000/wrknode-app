import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyLeadAutomation } from "@/lib/notifyLeadAutomation";

const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const DAILY_CAP_PER_EMAIL = 5;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!name || !emailPattern.test(email)) {
    return NextResponse.json(
      { error: "Please provide a name and a valid email." },
      { status: 400 }
    );
  }

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dedupCutoff = new Date(now.getTime() - DEDUP_WINDOW_MS);

  const recentByEmail = await prisma.lead.findMany({
    where: { email, createdAt: { gte: dayAgo } },
    orderBy: { createdAt: "desc" },
    take: DAILY_CAP_PER_EMAIL + 1,
  });

  // Same email submitted again within the dedup window (e.g. a double
  // click, or the AI reply email prompting a second try) — acknowledge
  // without creating a duplicate or re-triggering the AI reply.
  if (recentByEmail[0] && recentByEmail[0].createdAt >= dedupCutoff) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  // Basic abuse guard: no more than a handful of submissions per email per
  // day. This isn't IP-based rate limiting (that would need external state
  // this app doesn't have yet) - it's just enough to stop one address from
  // being spammed with "welcome" replies.
  if (recentByEmail.length >= DAILY_CAP_PER_EMAIL) {
    return NextResponse.json(
      { error: "Too many submissions from this email today. Please try again tomorrow." },
      { status: 429 }
    );
  }

  await prisma.lead.create({
    data: { name, email, message, source: "landing_page" },
  });

  await notifyLeadAutomation({ name, email, message, source: "landing_page" });

  return NextResponse.json({ ok: true });
}
