import type { ReactNode } from "react";
import Link from "next/link";
import AuthScene from "./AuthScene";

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  heroHeadline,
  heroSub,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  heroHeadline: string;
  heroSub: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen bg-[#0B0F1E]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,340;0,9..144,480;0,9..144,600;1,9..144,480&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Left: 3D scene + hero copy — hidden on small screens */}
      <div className="relative hidden w-1/2 overflow-hidden border-r border-[#C9A24B]/15 md:block">
        <AuthScene />

        {/* Decorative orbit-mark watermark, bottom-left */}
        <svg
          className="pointer-events-none absolute bottom-[-60px] left-[-60px] h-[320px] w-[320px] opacity-25 mix-blend-screen"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="90" stroke="#C9A24B" strokeWidth="0.6" />
          <circle cx="100" cy="100" r="65" stroke="#E4CE93" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="40" stroke="#C9A24B" strokeWidth="0.7" />
          <circle cx="100" cy="10" r="3.5" fill="#E4CE93" />
          <circle cx="190" cy="100" r="2.5" fill="#C9A24B" />
          <circle cx="35" cy="165" r="3" fill="#E4CE93" />
        </svg>

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,15,30,0.15) 0%, rgba(11,15,30,0.55) 68%, rgba(11,15,30,0.92) 100%)",
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-end p-12 lg:p-16">
          <div className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[#E4CE93]">
            Wrknode
          </div>
          <h2 className="mt-4 max-w-md font-['Fraunces',serif] text-[2.4rem] font-medium leading-[1.08] text-[#F2EEE4]">
            {heroHeadline}
          </h2>
          <p className="mt-4 max-w-sm text-[1.02rem] leading-relaxed text-[#ADB4CC]">{heroSub}</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex w-full items-center justify-center px-4 py-16 md:w-1/2">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 block text-center font-['Fraunces',serif] text-2xl font-semibold text-[#E4CE93] no-underline md:hidden"
          >
            Wrknode
          </Link>

          <div className="rounded-[28px] border border-[#C9A24B]/15 bg-[#0B0F1E]/70 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-10">
            <div className="font-['IBM_Plex_Mono',monospace] text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[#E4CE93]">
              {eyebrow}
            </div>
            <h1 className="mt-2 font-['Fraunces',serif] text-[1.9rem] font-medium leading-tight text-[#F2EEE4]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#ADB4CC]">{subtitle}</p>

            <div className="mt-8">{children}</div>
          </div>

          <p className="mt-6 text-center text-sm text-[#ADB4CC]">{footer}</p>
        </div>
      </div>
    </main>
  );
}
