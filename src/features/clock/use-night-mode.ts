"use client";

import { useEffect, useState } from "react";
import { isInNightWindow, type Settings } from "@/lib/settings";

/**
 * Resolves StandBy night mode from settings + schedule + optional AmbientLightSensor.
 */
export function useNightModeActive(settings: Settings): boolean {
  const [lightDark, setLightDark] = useState(false);
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    if (settings.nightMode !== "auto") return;

    const tick = () => setHour(new Date().getHours());
    const id = window.setInterval(tick, 60_000);

    type AmbientLightCtor = new () => {
      start: () => void;
      stop: () => void;
      illuminance: number;
      onreading: ((this: unknown, ev: Event) => void) | null;
      onerror: ((this: unknown, ev: Event) => void) | null;
    };

    const SensorCtor = (
      window as unknown as { AmbientLightSensor?: AmbientLightCtor }
    ).AmbientLightSensor;

    let sensor: InstanceType<AmbientLightCtor> | null = null;
    if (typeof SensorCtor === "function") {
      try {
        sensor = new SensorCtor();
        sensor.onreading = () => {
          if (!sensor) return;
          setLightDark(sensor.illuminance < 12);
        };
        sensor.onerror = () => {
          /* permission / unsupported — ignore */
        };
        sensor.start();
      } catch {
        sensor = null;
      }
    }

    return () => {
      clearInterval(id);
      try {
        sensor?.stop();
      } catch {
        /* ignore */
      }
    };
  }, [settings.nightMode]);

  if (settings.nightMode === "off") return false;
  if (settings.nightMode === "on") return true;

  const inWindow = isInNightWindow(
    hour,
    settings.nightStartHour,
    settings.nightEndHour,
  );
  return inWindow || lightDark;
}
