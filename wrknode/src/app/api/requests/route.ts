import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyLeadAutomation } from "@/lib/notifyLeadAutomation";

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

  await notifyLeadAutomation({
    name: session.user.name ?? session.user.email ?? "there",
    email: session.user.email ?? "",
    message,
    source: "dashboard_quote_request",
  });

  return NextResponse.json({ ok: true, request });
}
