"use client";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load the payment form. Check your connection."));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export type RazorpayOrderDetails = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  description: string;
  prefillEmail?: string;
};

// Resolves once the user completes payment; rejects if they cancel/close the
// modal or it fails. The webhook (not this callback) is the source of truth
// for actually marking something paid — this just drives the redirect.
export async function openRazorpayCheckout(order: RazorpayOrderDetails): Promise<void> {
  await loadRazorpayScript();

  return new Promise<void>((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Wrknode",
      description: order.description,
      order_id: order.orderId,
      prefill: order.prefillEmail ? { email: order.prefillEmail } : undefined,
      theme: { color: "#C9A24B" },
      handler: () => resolve(),
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
    });
    rzp.open();
  });
}
