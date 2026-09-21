import Link from "next/link";

export default function AdminNav({ active }: { active: "leads" | "plans" | "job-agent" }) {
  const linkClass = (key: "leads" | "plans" | "job-agent") =>
    `text-sm ${active === key ? "font-semibold text-gray-900" : "text-gray-500 hover:text-gray-900"}`;

  return (
    <nav className="mb-6 flex gap-4 border-b border-gray-200 pb-3">
      <Link href="/admin/leads" className={linkClass("leads")}>
        Leads
      </Link>
      <Link href="/admin/plans" className={linkClass("plans")}>
        Pricing plans
      </Link>
      <Link href="/admin/job-agent" className={linkClass("job-agent")}>
        Job agent
      </Link>
    </nav>
  );
}
