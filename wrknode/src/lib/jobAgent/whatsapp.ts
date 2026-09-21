// Plain Twilio REST call (Basic Auth + form body) — no SDK dependency,
// matching this app's fetch-only convention for third-party APIs.
export async function sendWhatsApp(message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"
  const to = process.env.JOB_AGENT_WHATSAPP_TO; // e.g. "whatsapp:+917998103343"

  if (!accountSid || !authToken || !from || !to) {
    console.error("Twilio env vars not fully set; skipping WhatsApp send.");
    return;
  }

  const body = new URLSearchParams({ From: from, To: to, Body: message });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    console.error("Twilio WhatsApp send failed:", res.status, await res.text().catch(() => ""));
  }
}
