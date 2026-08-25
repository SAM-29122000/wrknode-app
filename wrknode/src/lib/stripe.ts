import Stripe from "stripe";

let stripe: Stripe | null = null;

// Lazily constructed so importing this module (e.g. Next.js collecting
// route metadata at build time) never fails just because Stripe isn't
// configured yet. The error only surfaces if a request actually needs it.
export function getStripe(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripe = new Stripe(secretKey, {
      apiVersion: "2026-07-29.dahlia",
    });
  }
  return stripe;
}
