"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

const inputClass =
  "w-full rounded-lg border border-[#F2EEE4]/20 bg-[#F2EEE4]/[0.06] px-4 py-3 font-['IBM_Plex_Sans',sans-serif] text-[0.98rem] text-[#F2EEE4] placeholder:text-[#F2EEE4]/35 focus:border-[#E4CE93] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4CE93]";

const labelClass =
  "mb-1.5 block font-['IBM_Plex_Mono',monospace] text-[0.72rem] uppercase tracking-[0.08em] text-[#ADB4CC]";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthShell
      eyebrow="Client login"
      title="Welcome back."
      subtitle="Sign in to see your requests, quotes, and payment status."
      heroHeadline="Never let a lead go cold again."
      heroSub="Your requests, quotes, and build status — all in one place."
      footer={
        <>
          No account?{" "}
          <Link className="text-[#E4CE93] underline underline-offset-2" href="/signup">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        {error && <p className="text-sm text-[#E8837A]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-lg bg-[#C9A24B] px-4 py-3 font-['IBM_Plex_Sans',sans-serif] text-[1rem] font-semibold text-[#0B0F1E] transition-shadow hover:shadow-[0_10px_26px_rgba(201,162,75,0.4)] disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
