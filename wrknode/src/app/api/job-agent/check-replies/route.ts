import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  // "newer_than:1d" keeps returning the same messages on every poll, so
  // every message is checked against JobReplyLog (unique on Gmail's own
  // message id) before doing anything with it — otherwise the same reply
  // would get re-classified and re-sent to WhatsApp on every run.
  const messages = await listRecentInboxMessages("newer_than:1d -from:me");
  let notified = 0;

  for (const message of messages) {
    const alreadyLogged = await prisma.jobReplyLog.findUnique({ where: { gmailMessageId: message.id } });
    if (alreadyLogged) continue;

    const classification = await classifyReply({
      subject: message.subject,
      from: message.from,
      body: message.body,
    });

    if (classification.is_job_related) {
      await prisma.jobReplyLog.create({
        data: {
          gmailMessageId: message.id,
          subject: message.subject,
          fromAddress: message.from,
          category: classification.category,
          summary: classification.summary,
        },
      });
      await sendWhatsApp(
        `[${classification.category}] ${classification.summary}\nFrom: ${message.from}\nSubject: ${message.subject}`
      );
      notified++;
    } else {
      // Log non-job-related ones too (with a "not_job_related" category)
      // purely so they're never re-classified again on the next poll —
      // classification isn't free, and this email won't change.
      await prisma.jobReplyLog.create({
        data: {
          gmailMessageId: message.id,
          subject: message.subject,
          fromAddress: message.from,
          category: "not_job_related",
          summary: "",
        },
      });
    }
  }

  return NextResponse.json({ ok: true, checked: messages.length, notified });
}
