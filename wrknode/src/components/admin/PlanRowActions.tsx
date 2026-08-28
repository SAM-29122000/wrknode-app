"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PlanRowActions({
  planId,
  isActive,
}: {
  planId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    await fetch(`/api/admin/plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this plan? This can't be undone.")) return;
    setLoading(true);
    await fetch(`/api/admin/plans/${planId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href={`/admin/plans/${planId}/edit`} className="text-blue-600 underline">
        Edit
      </Link>
      <button onClick={toggleActive} disabled={loading} className="text-gray-600 underline">
        {isActive ? "Hide" : "Show"}
      </button>
      <button onClick={handleDelete} disabled={loading} className="text-red-600 underline">
        Delete
      </button>
    </div>
  );
}
