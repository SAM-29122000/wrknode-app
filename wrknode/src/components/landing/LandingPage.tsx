"use client";

import { useEffect, useRef } from "react";
import { landingCss } from "./styles";
import { landingBodyHtml } from "./markup";
import { initLanding } from "./initLanding";
import { loadScript } from "@/lib/loadScript";

const SCRIPT_SRCS = [
  "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js",
];

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      for (const src of SCRIPT_SRCS) {
        await loadScript(src);
      }
      if (!cancelled) {
        cleanup = initLanding();
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,340;0,9..144,480;0,9..144,600;1,9..144,480&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: landingCss }} />
      <div id="landing-root" ref={rootRef} dangerouslySetInnerHTML={{ __html: landingBodyHtml }} />
    </>
  );
}
