import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Wrknode — Never Let a Lead Go Cold Again",
  description:
    "Wrknode instantly replies to new leads so you never lose a deal to slow follow-up — built for real estate and other lead-driven businesses.",
  openGraph: {
    title: "Wrknode — Never Let a Lead Go Cold Again",
    description:
      "Wrknode instantly replies to new leads so you never lose a deal to slow follow-up — built for real estate and other lead-driven businesses.",
    type: "website",
  },
};

export default function Home() {
  return <LandingPage />;
}
