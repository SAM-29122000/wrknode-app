import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isAuthorizedCronRequest } from "@/lib/jobAgent/cronAuth";
import { classifyReply } from "@/lib/jobAgent/ai";
import { listRecentInboxMessages } from "@/lib/jobAgent/gmail";
import { sendWhatsApp } from "@/lib/jobAgent/whatsapp";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin && !isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const messages = await listRecentInboxMessages("newer_than:1d -from:me");
  let notified = 0;

  for (const message of messages) {
    const classification = await classifyReply({
      subject: message.subject,
      from: message.from,
      body: message.body,
    });

    if (classification.is_job_related) {
      await sendWhatsApp(
        `[${classification.category}] ${classification.summary}\nFrom: ${message.from}\nSubject: ${message.subject}`
      );
      notified++;
    }
  }

  return NextResponse.json({ ok: true, checked: messages.length, notified });
}
