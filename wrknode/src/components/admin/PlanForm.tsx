"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@prisma/client";

type PlanFormValues = {
  name: string;
  tagline: string;
  priceINR: string; // rupees, as typed
  priceUSD: string; // dollars, as typed
  features: string; // one per line
  ctaType: "CHECKOUT" | "SIGNUP" | "CONTACT";
  isPopular: boolean;
  isActive: boolean;
  sortOrder: string;
};

function toFormValues(plan?: Plan): PlanFormValues {
  if (!plan) {
    return {
      name: "",
      tagline: "",
      priceINR: "",
      priceUSD: "",
      features: "",
      ctaType: "CHECKOUT",
      isPopular: false,
      isActive: true,
      sortOrder: "0",
    };
  }
  return {
    name: plan.name,
    tagline: plan.tagline,
    priceINR: String(plan.priceINR / 100),
    priceUSD: String(plan.priceUSD / 100),
    features: plan.features.join("\n"),
    ctaType: plan.ctaType,
    isPopular: plan.isPopular,
    isActive: plan.isActive,
    sortOrder: String(plan.sortOrder),
  };
}

export default function PlanForm({ plan }: { plan?: Plan }) {
  const router = useRouter();
  const [values, setValues] = useState<PlanFormValues>(toFormValues(plan));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name: values.name.trim(),
      tagline: values.tagline.trim(),
      priceINR: Math.round(Number(values.priceINR) * 100),
      priceUSD: Math.round(Number(values.priceUSD) * 100),
      features: values.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      ctaType: values.ctaType,
      isPopular: values.isPopular,
      isActive: values.isActive,
      sortOrder: Number(values.sortOrder) || 0,
    };

    const url = plan ? `/api/admin/plans/${plan.id}` : "/api/admin/plans";
    const method = plan ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push("/admin/plans");
    router.refresh();
  }

  const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm";
  const labelClass = "mb-1 block text-sm font-medium";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          required
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          className={inputClass}
          placeholder="Starter Automation"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="tagline">
          Tagline
        </label>
        <input
          id="tagline"
          required
          value={values.tagline}
          onChange={(e) => setField("tagline", e.target.value)}
          className={inputClass}
          placeholder="One automation, built and handed off"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="priceINR">
            Price (₹, whole rupees)
          </label>
          <input
            id="priceINR"
            type="number"
            min="0"
            required
            value={values.priceINR}
            onChange={(e) => setField("priceINR", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="priceUSD">
            Price ($, whole dollars)
          </label>
          <input
            id="priceUSD"
            type="number"
            min="0"
            required
            value={values.priceUSD}
            onChange={(e) => setField("priceUSD", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="features">
          Features (one per line)
        </label>
        <textarea
          id="features"
          rows={5}
          value={values.features}
          onChange={(e) => setField("features", e.target.value)}
          className={inputClass}
          placeholder={"One automation workflow\nUp to 2 integrations\n2 weeks turnaround"}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="ctaType">
          Button behavior
        </label>
        <select
          id="ctaType"
          value={values.ctaType}
          onChange={(e) => setField("ctaType", e.target.value as PlanFormValues["ctaType"])}
          className={inputClass}
        >
          <option value="CHECKOUT">Buy now — instant Stripe checkout</option>
          <option value="SIGNUP">Get started — send to signup</option>
          <option value="CONTACT">Talk to us — send to contact form</option>
        </select>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isPopular}
            onChange={(e) => setField("isPopular", e.target.checked)}
          />
          Mark as &quot;Most popular&quot;
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => setField("isActive", e.target.checked)}
          />
          Visible on /pricing
        </label>
      </div>

      <div>
        <label className={labelClass} htmlFor="sortOrder">
          Sort order (lower shows first)
        </label>
        <input
          id="sortOrder"
          type="number"
          value={values.sortOrder}
          onChange={(e) => setField("sortOrder", e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Saving..." : plan ? "Save changes" : "Create plan"}
      </button>
    </form>
  );
}
