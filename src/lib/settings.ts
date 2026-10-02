import { z } from "zod";
import { strings } from "@/lib/strings";

export const ACCENT_PRESETS = [
  { id: "cyan", label: "Cyan", value: "#22d3ee" },
  { id: "green", label: "Green", value: "#4ade80" },
  { id: "amber", label: "Amber", value: "#fbbf24" },
  { id: "rose", label: "Rose", value: "#fb7185" },
  { id: "blue", label: "Blue", value: "#60a5fa" },
] as const;

export type AccentId = (typeof ACCENT_PRESETS)[number]["id"];

export const CLOCK_STYLES = [
  { id: "glass", label: strings.clock.styles.glass },
  { id: "solid", label: strings.clock.styles.solid },
  { id: "analog", label: strings.clock.styles.analog },
] as const;

export type ClockStyleId = (typeof CLOCK_STYLES)[number]["id"];

export const SettingsSchema = z.object({
  version: z.literal(1),
  showSeconds: z.boolean().default(false),
  nightDim: z.boolean().default(false),
  nightMode: z.enum(["off", "auto", "on"]).default("off"),
  nightStartHour: z.number().int().min(0).max(23).default(22),
  nightEndHour: z.number().int().min(0).max(23).default(6),
  clockStyle: z.enum(["glass", "solid", "analog"]).default("glass"),
  hour12: z.enum(["system", "12", "24"]).default("system"),
  showTimer: z.boolean().default(false),
  accent: z
    .enum(["cyan", "green", "amber", "rose", "blue"])
    .default("cyan"),
  selectedRepos: z.array(z.string()).default([]),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  showSeconds: false,
  nightDim: false,
  nightMode: "off",
  nightStartHour: 22,
  nightEndHour: 6,
  clockStyle: "glass",
  hour12: "system",
  showTimer: false,
  accent: "cyan",
  selectedRepos: [],
};

const STORAGE_KEY = "perch.settings.v1";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const json: unknown = JSON.parse(raw);
    const parsed = SettingsSchema.safeParse(json);
    if (!parsed.success) return DEFAULT_SETTINGS;
    const data = parsed.data;
    if (
      json &&
      typeof json === "object" &&
      "nightDim" in json &&
      (json as { nightDim?: boolean }).nightDim === true &&
      !("nightMode" in json)
    ) {
      return { ...data, nightMode: "on" };
    }
    return data;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function accentValue(id: AccentId): string {
  return ACCENT_PRESETS.find((p) => p.id === id)?.value ?? "#22d3ee";
}

export function isInNightWindow(
  hour: number,
  startHour: number,
  endHour: number,
): boolean {
  if (startHour === endHour) return false;
  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }
  return hour >= startHour || hour < endHour;
}
