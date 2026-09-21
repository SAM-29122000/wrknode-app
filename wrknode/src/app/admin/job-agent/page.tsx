import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import RunJobAgentButton from "@/components/admin/RunJobAgentButton";

const statusStyles: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  SENT: "bg-green-100 text-green-800",
  SKIPPED: "bg-gray-100 text-gray-600",
  SCORED_LOW: "bg-gray-100 text-gray-400",
};

export default async function AdminJobAgentPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [leads, counts] = await Promise.all([
    prisma.jobLead.findMany({
      where: { status: { not: "SCORED_LOW" } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.jobLead.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count.status]));

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-white px-4 py-10 text-gray-900">
      <AdminNav active="job-agent" />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Job application agent</h1>
        <p className="text-sm text-gray-600">
          Matches ≥70% get drafted and sent to WhatsApp for APPLY/SKIP. Low-scoring matches are
          hidden here but still logged (view them via <code>npx prisma studio</code>) so nothing
          gets re-scored twice.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-6">
        <div className="flex gap-4 text-sm">
          <span>
            Pending: <strong>{countByStatus.PENDING ?? 0}</strong>
          </span>
          <span>
            Sent: <strong>{countByStatus.SENT ?? 0}</strong>
          </span>
          <span>
            Skipped: <strong>{countByStatus.SKIPPED ?? 0}</strong>
          </span>
          <span>
            Scored low: <strong>{countByStatus.SCORED_LOW ?? 0}</strong>
          </span>
        </div>
        <div className="flex gap-3">
          <RunJobAgentButton endpoint="/api/job-agent/discover" label="Run discovery now" />
          <RunJobAgentButton endpoint="/api/job-agent/check-replies" label="Check replies now" />
        </div>
      </div>

      {leads.length === 0 ? (
        <p className="text-gray-600">
          No matches yet — run discovery above once your Adzuna/Jooble/OpenAI env vars are set.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {leads.map((lead) => (
            <li key={lead.id} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    statusStyles[lead.status] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {lead.status}
                  {lead.matchScore != null ? ` · ${lead.matchScore}%` : ""}
                </span>
                <span className="text-xs text-gray-500">
                  {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
                    lead.createdAt
                  )}
                </span>
              </div>
              <a href={lead.url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 underline">
                {lead.title}
              </a>
              <p className="text-sm text-gray-600">
                {lead.company ?? "Unknown company"} · {lead.location ?? "Location unknown"} ·{" "}
                {lead.source}
              </p>
              {lead.reasoning && <p className="mt-2 text-sm text-gray-700">{lead.reasoning}</p>}
              {lead.draftEmail && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-500">Drafted email</summary>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{lead.draftEmail}</p>
                </details>
              )}
              <p className="mt-2 text-xs text-gray-400">
                Reply on WhatsApp: APPLY-{lead.id} or SKIP-{lead.id}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
