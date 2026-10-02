"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  accentValue,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type Settings,
} from "@/lib/settings";
import { useNightModeActive } from "@/features/clock/use-night-mode";

type SettingsContextValue = {
  settings: Settings;
  ready: boolean;
  nightModeActive: boolean;
  update: (patch: Partial<Settings>) => void;
  setSettings: (next: Settings) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const nightModeActive = useNightModeActive(settings);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSettingsState(loadSettings());
      setReady(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveSettings(settings);
    document.documentElement.style.setProperty(
      "--accent",
      accentValue(settings.accent),
    );
  }, [settings, ready]);

  useEffect(() => {
    document.documentElement.dataset.nightMode = nightModeActive ? "1" : "0";
    // Keep legacy attr in sync for any leftover CSS
    document.documentElement.dataset.night = nightModeActive ? "1" : "0";
  }, [nightModeActive]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setSettings = useCallback((next: Settings) => {
    setSettingsState(next);
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, ready, nightModeActive, update, setSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
