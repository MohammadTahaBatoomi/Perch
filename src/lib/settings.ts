import { z } from "zod";

export const ACCENT_PRESETS = [
  { id: "cyan", label: "Cyan", value: "#22d3ee" },
  { id: "green", label: "Green", value: "#4ade80" },
  { id: "amber", label: "Amber", value: "#fbbf24" },
  { id: "rose", label: "Rose", value: "#fb7185" },
  { id: "blue", label: "Blue", value: "#60a5fa" },
] as const;

export type AccentId = (typeof ACCENT_PRESETS)[number]["id"];

export const SettingsSchema = z.object({
  version: z.literal(1),
  showSeconds: z.boolean().default(false),
  persianDigits: z.boolean().default(true),
  nightDim: z.boolean().default(false),
  accent: z
    .enum(["cyan", "green", "amber", "rose", "blue"])
    .default("cyan"),
  selectedRepos: z.array(z.string()).default([]),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  showSeconds: false,
  persianDigits: true,
  nightDim: false,
  accent: "cyan",
  selectedRepos: [],
};

const STORAGE_KEY = "perch.settings.v1";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = SettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
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
