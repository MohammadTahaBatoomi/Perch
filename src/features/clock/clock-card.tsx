"use client";

import { useEffect, useMemo, useState } from "react";
import { useSettings } from "@/features/settings/settings-provider";
import { strings } from "@/lib/strings";
import { AnalogClock } from "./analog-clock";
import { DigitalClock } from "./digital-clock";
import { StandbyTimer } from "./standby-timer";
import { useHour12, useNow } from "./use-now";

/**
 * iOS StandBy–inspired hero clock. No backdrop-filter behind digits.
 * Burn-in shift is applied by AppShell to the whole shell.
 */
export function ClockCard() {
  const { settings } = useSettings();
  const now = useNow();
  const hour12 = useHour12(settings.hour12);
  const [forcedSolid, setForcedSolid] = useState(false);
  const [noTranslucency, setNoTranslucency] = useState(false);

  useEffect(() => {
    const contrast = window.matchMedia("(prefers-contrast: more)");
    const transparency = window.matchMedia(
      "(prefers-reduced-transparency: reduce)",
    );
    const sync = () => {
      setForcedSolid(contrast.matches);
      setNoTranslucency(transparency.matches);
    };
    const t = window.setTimeout(sync, 0);
    contrast.addEventListener("change", sync);
    transparency.addEventListener("change", sync);
    return () => {
      clearTimeout(t);
      contrast.removeEventListener("change", sync);
      transparency.removeEventListener("change", sync);
    };
  }, []);

  const clockStyle = useMemo(() => {
    if (forcedSolid) return "solid" as const;
    if (noTranslucency && settings.clockStyle === "glass") return "solid" as const;
    return settings.clockStyle;
  }, [forcedSolid, noTranslucency, settings.clockStyle]);

  const minuteKey = now
    ? `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`
    : "";

  const ariaLabel = useMemo(() => {
    if (!now || !minuteKey) return strings.clock.label;
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12,
    }).format(now);
  }, [minuteKey, hour12, now]);

  if (!now) {
    return (
      <section className="standby-hero">
        <div className="skeleton standby-hero__skeleton" />
      </section>
    );
  }

  const dateLine = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);

  return (
    <section
      className="standby-hero"
      role="img"
      aria-label={ariaLabel || strings.clock.label}
    >
      {settings.showTimer ? (
        <StandbyTimer />
      ) : clockStyle === "analog" ? (
        <AnalogClock
          hours={now.getHours()}
          minutes={now.getMinutes()}
          seconds={now.getSeconds()}
          showSeconds={settings.showSeconds}
        />
      ) : (
        <DigitalClock
          hours={now.getHours()}
          minutes={now.getMinutes()}
          seconds={now.getSeconds()}
          showSeconds={settings.showSeconds}
          hour12={hour12}
          style={clockStyle}
        />
      )}
      <p className="standby-hero__date">{dateLine}</p>
    </section>
  );
}
