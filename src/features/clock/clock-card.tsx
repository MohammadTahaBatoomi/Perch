"use client";

import { useEffect, useState } from "react";
import { formatDigits, pad2 } from "@/lib/format";
import { useSettings } from "@/features/settings/settings-provider";

function useNow(): Date | null {
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

export function ClockCard() {
  const { settings } = useSettings();
  const now = useNow();

  if (!now) {
    return (
      <section className="card flex h-full flex-col justify-center gap-2 p-4">
        <div className="skeleton h-14 w-48" />
        <div className="skeleton h-5 w-40" />
        <div className="skeleton h-4 w-32" />
      </section>
    );
  }

  const blink = now.getSeconds() % 2 === 0;

  const h = pad2(now.getHours());
  const m = pad2(now.getMinutes());
  const s = pad2(now.getSeconds());
  const d = settings.persianDigits;

  const jalali = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  const gregorian = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);

  const jalaliDisplay = d ? jalali : toAsciiDigits(jalali);

  return (
    <section className="card flex h-full flex-col justify-center gap-2 p-4">
      <div
        className="font-mono text-[clamp(2.75rem,8vw,4.5rem)] font-medium leading-none tracking-tight text-zinc-50 tabular-nums"
        aria-live="polite"
      >
        <span>{formatDigits(h, d)}</span>
        <span
          className={`mx-0.5 inline-block w-[0.35em] text-center transition-opacity duration-200 ${
            blink ? "opacity-100" : "opacity-25"
          }`}
          style={{ color: "var(--accent)" }}
        >
          :
        </span>
        <span>{formatDigits(m, d)}</span>
        {settings.showSeconds && (
          <>
            <span className="mx-0.5 text-[0.45em] text-zinc-500">:</span>
            <span className="text-[0.45em] text-zinc-400">
              {formatDigits(s, d)}
            </span>
          </>
        )}
      </div>
      <div className="font-vazir text-base leading-snug text-zinc-200 sm:text-lg">
        {jalaliDisplay}
      </div>
      <div className="text-xs text-zinc-500 sm:text-sm">{gregorian}</div>
    </section>
  );
}

function toAsciiDigits(input: string): string {
  const map: Record<string, string> = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  return input.replace(/[۰-۹٠-٩]/g, (c) => map[c] ?? c);
}
