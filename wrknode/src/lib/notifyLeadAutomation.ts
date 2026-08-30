const LEAD_WEBHOOK_URL = "https://capricornxd.app.n8n.cloud/webhook/wrknode-lead";

// Awaited (with a short timeout) rather than fire-and-forget: on serverless
// hosting the function can be frozen the instant the response is sent, which
// would silently drop an un-awaited fetch. n8n's webhook acks immediately
// (the AI reply itself runs after that ack), so this normally adds well
// under a second.
export async function notifyLeadAutomation(payload: {
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
