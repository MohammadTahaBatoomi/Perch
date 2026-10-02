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

type SettingsContextValue = {
  settings: Settings;
  ready: boolean;
  update: (patch: Partial<Settings>) => void;
  setSettings: (next: Settings) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Defer hydration from localStorage to avoid sync setState-in-effect lint.
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
    document.documentElement.dataset.night = settings.nightDim ? "1" : "0";
  }, [settings, ready]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setSettings = useCallback((next: Settings) => {
    setSettingsState(next);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, ready, update, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
