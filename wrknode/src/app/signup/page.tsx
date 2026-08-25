"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

const inputClass =
  "w-full rounded-lg border border-[#F2EEE4]/20 bg-[#F2EEE4]/[0.06] px-4 py-3 font-['IBM_Plex_Sans',sans-serif] text-[0.98rem] text-[#F2EEE4] placeholder:text-[#F2EEE4]/35 focus:border-[#E4CE93] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4CE93]";

const labelClass =
  "mb-1.5 block font-['IBM_Plex_Mono',monospace] text-[0.72rem] uppercase tracking-[0.08em] text-[#ADB4CC]";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account."
      subtitle="Submit a request, get a quote, and pay once you're ready to start."
      heroHeadline="Automation, built around your workflow."
      heroSub="Tell us what you need. We'll scope it, quote it, and build it — start to finish."
      footer={
        <>
          Already have an account?{" "}
          <Link className="text-[#E4CE93] underline underline-offset-2" href="/login">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className={labelClass} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-[#ADB4CC]">At least 8 characters.</p>
        </div>
        {error && <p className="text-sm text-[#E8837A]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-lg bg-[#C9A24B] px-4 py-3 font-['IBM_Plex_Sans',sans-serif] text-[1rem] font-semibold text-[#0B0F1E] transition-shadow hover:shadow-[0_10px_26px_rgba(201,162,75,0.4)] disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
    </AuthShell>
  );
}
