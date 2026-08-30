import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLeadsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-white px-4 py-10 text-gray-900">
      <AdminNav active="leads" />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <p className="text-sm text-gray-600">
          Landing-page and dashboard-request submissions, most recent first.
        </p>
      </div>

      {leads.length === 0 ? (
        <p className="text-gray-600">No leads yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {leads.map((lead) => (
            <li key={lead.id} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{lead.name}</span>
                <span className="text-xs text-gray-500">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(lead.createdAt)}
                </span>
              </div>
              <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 underline">
                {lead.email}
              </a>
              {lead.message && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{lead.message}</p>
              )}
              <span className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {lead.source}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
