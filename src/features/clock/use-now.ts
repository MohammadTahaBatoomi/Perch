"use client";

import { useEffect, useState } from "react";

/**
 * Wall-clock ticker. Default: once per second (digital).
 * Pass `smooth` for ~4fps updates (analog second-hand sweep without heavy rAF).
 */
export function useNow(smooth = false): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let raf = 0;
    let timeout: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      setNow(new Date());
      if (smooth) {
        // ~4 Hz — smooth enough for analog, cheap on old phones
        timeout = setTimeout(() => {
          raf = requestAnimationFrame(tick);
        }, 250);
      } else {
        const ms = 1000 - (Date.now() % 1000);
        timeout = setTimeout(() => {
          raf = requestAnimationFrame(tick);
        }, ms);
      }
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [smooth]);

  return now;
}

export function useHour12(setting: "system" | "12" | "24"): boolean {
  const [system12, setSystem12] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const fmt = new Intl.DateTimeFormat(undefined, { hour: "numeric" });
        const opts = fmt.resolvedOptions();
        setSystem12(Boolean(opts.hour12));
      } catch {
        setSystem12(false);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (setting === "12") return true;
  if (setting === "24") return false;
  return system12;
}
