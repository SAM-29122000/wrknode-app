"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@prisma/client";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function PricingCards({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [region, setRegion] = useState<"INDIA" | "INTERNATIONAL">("INDIA");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCta(plan: Plan) {
    setError(null);

    if (plan.ctaType === "SIGNUP") {
      router.push(`/signup?plan=${plan.id}`);
      return;
    }

    if (plan.ctaType === "CONTACT") {
      window.location.href = "/#access";
      return;
    }

    // CHECKOUT
    setLoadingPlanId(plan.id);

    const res = await fetch(`/api/plans/${plan.id}/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region }),
    });

    if (res.status === 401) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/pricing")}`);
      return;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.url) {
      setError(data.error ?? "Couldn't start checkout.");
      setLoadingPlanId(null);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div>
      <div className="mb-10 flex justify-center">
        <div className="inline-flex rounded-full border border-[#C9A24B]/20 bg-[#F2EEE4]/[0.04] p-1">
          <button
            onClick={() => setRegion("INDIA")}
            className={`rounded-full px-4 py-1.5 font-['IBM_Plex_Sans',sans-serif] text-sm transition-colors ${
              region === "INDIA" ? "bg-[#C9A24B] text-[#0B0F1E]" : "text-[#ADB4CC]"
            }`}
          >
            India (₹)
          </button>
          <button
            onClick={() => setRegion("INTERNATIONAL")}
            className={`rounded-full px-4 py-1.5 font-['IBM_Plex_Sans',sans-serif] text-sm transition-colors ${
              region === "INTERNATIONAL" ? "bg-[#C9A24B] text-[#0B0F1E]" : "text-[#ADB4CC]"
            }`}
          >
            International ($)
          </button>
        </div>
      </div>

      {error && <p className="mb-6 text-center text-sm text-[#E8837A]">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = region === "INDIA" ? plan.priceINR : plan.priceUSD;
          const formatted =
            region === "INDIA" ? inrFormatter.format(price / 100) : usdFormatter.format(price / 100);

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-[24px] border p-8 backdrop-blur-md ${
                plan.isPopular
                  ? "border-[#C9A24B]/50 bg-[#0B0F1E]/70 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
                  : "border-[#C9A24B]/15 bg-[#0B0F1E]/70"
              }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 left-8 rounded-full bg-[#C9A24B] px-3 py-1 font-['IBM_Plex_Mono',monospace] text-[0.65rem] font-semibold uppercase tracking-wide text-[#0B0F1E]">
                  Most popular
                </span>
              )}

              <h3 className="font-['Fraunces',serif] text-[1.4rem] font-medium text-[#F2EEE4]">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-[#ADB4CC]">{plan.tagline}</p>

              <div className="mt-6 font-['Fraunces',serif] text-[2rem] font-medium text-[#F2EEE4]">
                {plan.ctaType === "CONTACT" ? "Custom" : formatted}
              </div>

              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm leading-relaxed text-[#ADB4CC]"
                  >
                    <span className="mt-0.5 text-[#E4CE93]">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCta(plan)}
                disabled={loadingPlanId === plan.id}
                className="mt-8 rounded-lg bg-[#C9A24B] px-4 py-3 font-['IBM_Plex_Sans',sans-serif] text-[0.98rem] font-semibold text-[#0B0F1E] transition-shadow hover:shadow-[0_10px_26px_rgba(201,162,75,0.4)] disabled:opacity-50"
              >
                {loadingPlanId === plan.id
                  ? "Starting checkout..."
                  : plan.ctaType === "CHECKOUT"
                    ? "Buy now"
                    : plan.ctaType === "SIGNUP"
                      ? "Get started"
                      : "Talk to us"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
