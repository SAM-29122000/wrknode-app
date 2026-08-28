import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PricingCards from "@/components/pricing/PricingCards";

export const metadata: Metadata = {
  title: "Pricing — Wrknode",
  description: "Pick a Wrknode automation package, or talk to us about something custom.",
};

export const revalidate = 300;

export default async function PricingPage() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="relative min-h-screen bg-[#0B0F1E] px-4 py-20 sm:px-8">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,340;0,9..144,480;0,9..144,600;1,9..144,480&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div className="mx-auto max-w-5xl text-center">
        <div className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[#E4CE93]">
          Pricing
        </div>
        <h1 className="mt-4 font-['Fraunces',serif] text-[2.4rem] font-medium leading-[1.1] text-[#F2EEE4] sm:text-[3rem]">
          Pick a package, or build something custom.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[1.02rem] leading-relaxed text-[#ADB4CC]">
          Fixed packages for common needs, or talk to us if what you need doesn&apos;t fit a box.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-5xl">
        {plans.length === 0 ? (
          <p className="text-center text-[#ADB4CC]">
            No packages published yet — check back soon.
          </p>
        ) : (
          <PricingCards plans={plans} />
        )}
      </div>
    </main>
  );
}
