import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PlanRowActions from "@/components/admin/PlanRowActions";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminPlansPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-white px-4 py-10 text-gray-900">
      <AdminNav active="plans" />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pricing plans</h1>
          <p className="text-sm text-gray-600">Shown live on /pricing — edits apply immediately.</p>
        </div>
        <Link
          href="/admin/plans/new"
          className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800"
        >
          New plan
        </Link>
      </div>

      {plans.length === 0 ? (
        <p className="text-gray-600">No plans yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {plans.map((plan) => (
            <li
              key={plan.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{plan.name}</span>
                  {plan.isPopular && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Popular
                    </span>
                  )}
                  {!plan.isActive && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-gray-600">
                  {plan.ctaType === "CONTACT"
                    ? "Custom pricing"
                    : `₹${(plan.priceINR / 100).toLocaleString("en-IN")} / $${(
                        plan.priceUSD / 100
                      ).toLocaleString("en-US")}`}
                  {" · "}
                  {plan.ctaType}
                </p>
              </div>
              <PlanRowActions planId={plan.id} isActive={plan.isActive} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
