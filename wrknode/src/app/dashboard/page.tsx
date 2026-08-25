import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/components/SignOutButton";
import PayButton from "@/components/PayButton";

const statusStyles: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  QUOTED: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const requests = await prisma.clientRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-white px-4 py-10 text-gray-900">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your requests</h1>
          <p className="text-sm text-gray-600">
            Signed in as {session.user.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/new"
            className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800"
          >
            New request
          </Link>
          <SignOutButton />
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-gray-600">
          <p>You haven&apos;t submitted any requests yet.</p>
          <Link className="mt-2 inline-block underline" href="/dashboard/new">
            Submit your first request
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {requests.map((r) => (
            <li key={r.id} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    statusStyles[r.status] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {r.status.replace("_", " ")}
                </span>
                <span className="text-xs text-gray-500">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                  }).format(r.createdAt)}
                </span>
              </div>
              <p className="mb-3 whitespace-pre-wrap text-sm">{r.message}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Region: {r.region}</span>
                  {r.quotedPrice != null && (
                    <span>
                      Quoted:{" "}
                      {(r.quotedPrice / 100).toLocaleString(undefined, {
                        style: "currency",
                        currency: r.region === "INDIA" ? "INR" : "USD",
                      })}
                    </span>
                  )}
                  {r.paidAt && (
                    <span className="font-medium text-green-700">
                      Paid{" "}
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
                        r.paidAt
                      )}
                    </span>
                  )}
                </div>
                {r.status === "QUOTED" && r.quotedPrice != null && !r.paidAt && (
                  <PayButton requestId={r.id} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
