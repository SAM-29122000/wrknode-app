"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewRequestPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [region, setRegion] = useState<"INDIA" | "INTERNATIONAL">("INDIA");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, region }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-white px-4 py-10 text-gray-900">
      <div className="mb-8">
        <Link className="text-sm text-gray-600 underline" href="/dashboard">
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New request</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="message">
            What do you need?
          </label>
          <textarea
            id="message"
            required
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="Describe the project, follow-up, or change you're requesting..."
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="region">
            Region
          </label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value as "INDIA" | "INTERNATIONAL")}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="INDIA">India</option>
            <option value="INTERNATIONAL">International</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit request"}
        </button>
      </form>
    </main>
  );
}
