import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PlanForm from "@/components/admin/PlanForm";

export default async function EditPlanPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const plan = await prisma.plan.findUnique({ where: { id: params.id } });
  if (!plan) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white px-4 py-10 text-gray-900">
      <Link href="/admin/plans" className="text-sm text-gray-600 underline">
        &larr; Back to plans
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Edit plan</h1>
      <PlanForm plan={plan} />
    </main>
  );
}
