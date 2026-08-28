import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const region = body?.region === "INTERNATIONAL" ? "INTERNATIONAL" : "INDIA";

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const request = await prisma.clientRequest.create({
    data: {
      userId: session.user.id,
      message,
      region,
    },
  });

  // Awaited (with a short timeout) rather than fire-and-forget: on serverless
  // hosting the function can be frozen the instant the response is sent, which
  // would silently drop an un-awaited fetch. n8n's webhook acks immediately
  // (the AI reply itself runs after that ack), so this normally adds well
  // under a second.
  await notifyLeadAutomation({
    name: session.user.name ?? session.user.email ?? "there",
    email: session.user.email ?? "",
    message,
    source: "dashboard_quote_request",
  });

  return NextResponse.json({ ok: true, request });
}

const LEAD_WEBHOOK_URL = "https://capricornxd.app.n8n.cloud/webhook/wrknode-lead";

async function notifyLeadAutomation(payload: {
  name: string;
  email: string;
  message: string;
  source: string;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    await fetch(LEAD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }),
      signal: controller.signal,
    });
  } catch (err) {
    console.error("Failed to notify lead automation webhook:", err);
  } finally {
    clearTimeout(timeout);
  }
}
