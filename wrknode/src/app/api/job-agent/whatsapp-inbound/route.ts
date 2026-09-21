import { prisma } from "@/lib/prisma";
import { sendApplicationEmail } from "@/lib/jobAgent/gmail";
import { sendWhatsApp } from "@/lib/jobAgent/whatsapp";

const EMPTY_TWIML = new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", {
  status: 200,
  headers: { "Content-Type": "text/xml" },
});

export async function POST(req: Request) {
  const form = await req.formData();
  const body = String(form.get("Body") ?? "").trim();

  const match = body.match(/^(APPLY|SKIP)-(.+)$/i);
  if (!match) {
    await sendWhatsApp(
      "Sorry, I didn't understand that. Reply like: APPLY-<id> or SKIP-<id> (use the ID from the job match message)."
    );
    return EMPTY_TWIML;
  }

  const action = match[1].toUpperCase();
  const id = match[2].trim();

  const lead = await prisma.jobLead.findUnique({ where: { id } });
  if (!lead) {
    await sendWhatsApp(`Couldn't find a pending job match with ID ${id} — it may already be handled.`);
    return EMPTY_TWIML;
  }

  if (action === "SKIP") {
    await prisma.jobLead.update({ where: { id }, data: { status: "SKIPPED" } });
    await sendWhatsApp(`Got it — skipped ${lead.title} at ${lead.company ?? "that company"}.`);
    return EMPTY_TWIML;
  }

  // APPLY
  if (lead.applyEmail) {
    try {
      await sendApplicationEmail(
        lead.applyEmail,
        `Application: ${lead.title} — Santanu Chatterjee`,
        lead.draftEmail ?? ""
      );
      await prisma.jobLead.update({ where: { id }, data: { status: "SENT" } });
      await sendWhatsApp(`Sent — application emailed for ${lead.title} at ${lead.company ?? "that company"}.`);
    } catch (err) {
      console.error("Failed to send application email:", err);
      await sendWhatsApp(
        `Couldn't send the email automatically for ${lead.title} — something went wrong on my end. You can still apply directly: ${lead.url}`
      );
    }
  } else {
    // Adzuna/Jooble don't expose a direct applicant email — there's
    // nothing to legitimately auto-send to, so this stays a manual step.
    await prisma.jobLead.update({ where: { id }, data: { status: "SENT" } });
    await sendWhatsApp(
      `${lead.title} at ${lead.company ?? "that company"} doesn't have a direct application email — apply here: ${lead.url}\n\nHere's the drafted email text if you want to paste it into their application form:\n\n${lead.draftEmail ?? ""}`
    );
  }

  return EMPTY_TWIML;
}
