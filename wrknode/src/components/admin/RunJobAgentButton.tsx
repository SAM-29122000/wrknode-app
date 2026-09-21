"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunJobAgentButton({ endpoint, label }: { endpoint: string; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    const res = await fetch(endpoint, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setResult(data.error ?? "Something went wrong.");
      return;
    }
    setResult(JSON.stringify(data));
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={run}
        disabled={loading}
        className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Running..." : label}
      </button>
      {result && <span className="text-xs text-gray-500">{result}</span>}
    </div>
  );
}
