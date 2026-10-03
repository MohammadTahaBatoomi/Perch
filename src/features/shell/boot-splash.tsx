"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AppLoader } from "@/features/shell/app-loader";

const MIN_MS = 700;
const FADE_MS = 320;
const MAX_MS = 5000;

/**
 * Branded overlay until the first paint / load settles.
 * Covers Capacitor WebView blank frames while the remote desk server boots.
 */
export function BootSplash({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    const started = performance.now();
    let fadeTimer = 0;
    let goneTimer = 0;
    let maxTimer = 0;

    const dismiss = () => {
      const elapsed = performance.now() - started;
      const wait = Math.max(0, MIN_MS - elapsed);
      fadeTimer = window.setTimeout(() => {
        setPhase("fade");
        goneTimer = window.setTimeout(() => setPhase("gone"), FADE_MS);
      }, wait);
    };

    if (document.readyState === "complete") {
      dismiss();
    } else {
      window.addEventListener("load", dismiss, { once: true });
    }

    // Safety: never block the desk UI if load hangs.
    maxTimer = window.setTimeout(dismiss, MAX_MS);

    return () => {
      window.removeEventListener("load", dismiss);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(goneTimer);
      window.clearTimeout(maxTimer);
    };
  }, []);

  return (
    <>
      {children}
      {phase !== "gone" ? (
        <div
          className="app-boot fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-[320ms] ease-[var(--ease-out)]"
          style={{ opacity: phase === "fade" ? 0 : 1 }}
          aria-hidden={phase === "fade" || undefined}
        >
          <AppLoader />
        </div>
      ) : null}
    </>
  );
}
