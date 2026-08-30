// Plain fetch against Razorpay's REST API instead of their SDK — avoids
// adding a new npm dependency that can't be installed/verified in this
// environment (no Node here). Basic Auth per Razorpay's docs: key id as
// username, key secret as password.

function getCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET is not set");
  }
  return { keyId, keySecret };
}

export function getRazorpayKeyId(): string {
  return getCredentials().keyId;
}

export async function createRazorpayOrder(params: {
  amount: number; // smallest currency subunit (paise for INR, cents for USD)
  currency: "INR" | "USD";
  receipt: string; // max 40 chars, unique
  notes?: Record<string, string>;
}): Promise<{ id: string }> {
  const { keyId, keySecret } = getCredentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order creation failed: ${text}`);
  }

  return res.json();
}
