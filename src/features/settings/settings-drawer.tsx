"use client";

import { useState } from "react";
import { Settings, X } from "lucide-react";
import { ACCENT_PRESETS } from "@/lib/settings";
import { useSettings } from "./settings-provider";

export function SettingsDrawer({
  onChooseRepos,
}: {
  onChooseRepos: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { settings, update } = useSettings();
  const [busy, setBusy] = useState(false);

  const disconnect = async () => {
    setBusy(true);
    try {
      await fetch("/api/github/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revoke: false }),
      });
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        aria-label="Settings"
      >
        <Settings size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <aside className="flex h-full w-full max-w-sm flex-col bg-zinc-950 ring-1 ring-zinc-800">
            <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-medium text-zinc-100">Settings</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-800"
                aria-label="Close settings"
              >
                <X size={16} />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-auto p-4 text-sm">
              <Toggle
                label="Show seconds"
                checked={settings.showSeconds}
                onChange={(v) => update({ showSeconds: v })}
              />
              <Toggle
                label="Persian digits"
                checked={settings.persianDigits}
                onChange={(v) => update({ persianDigits: v })}
              />
              <Toggle
                label="Night dim"
                checked={settings.nightDim}
                onChange={(v) => update({ nightDim: v })}
              />

              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
                  Accent
                </p>
                <div className="flex gap-2">
                  {ACCENT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      title={p.label}
                      onClick={() => update({ accent: p.id })}
                      className={`h-7 w-7 rounded-full ring-2 ${
                        settings.accent === p.id
                          ? "ring-white"
                          : "ring-transparent"
                      }`}
                      style={{ background: p.value }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="w-full rounded bg-zinc-900 px-3 py-2 text-left text-zinc-200 ring-1 ring-zinc-800 hover:bg-zinc-800"
                onClick={() => {
                  setOpen(false);
                  onChooseRepos();
                }}
              >
                Choose GitHub repos…
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void disconnect()}
                className="w-full rounded px-3 py-2 text-left text-red-400 ring-1 ring-red-900/50 hover:bg-red-950/40 disabled:opacity-50"
              >
                Disconnect GitHub
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-zinc-200">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${
          checked ? "bg-[var(--accent)]" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
    </label>
  );
}
