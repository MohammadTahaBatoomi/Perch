"use client";

import { useEffect, useState } from "react";

export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let raf = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      setNow(new Date());
      const ms = 1000 - (Date.now() % 1000);
      timeout = setTimeout(() => {
        raf = requestAnimationFrame(tick);
      }, ms);
    };

    tick();
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, []);

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
