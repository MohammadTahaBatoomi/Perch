"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Settings, X } from "lucide-react";
import { ACCENT_PRESETS, CLOCK_STYLES } from "@/lib/settings";
import { strings } from "@/lib/strings";
import { useSettings } from "./settings-provider";

export function SettingsDrawer({
  onChooseRepos,
}: {
  onChooseRepos: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { settings, update } = useSettings();
  const [busy, setBusy] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-icon"
        aria-label={strings.chrome.settings}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Settings size={16} strokeWidth={2} />
      </button>

      {open && (
        <div
          className="scrim flex justify-end"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <aside
            className="drawer-panel glass-elevated flex h-full w-full max-w-sm flex-col rounded-none rounded-s-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <header className="flex items-center justify-between border-b border-[color-mix(in_oklab,#ffffff_8%,transparent)] px-4 py-3">
              <h2
                id={titleId}
                className="text-sm font-semibold tracking-tight text-foreground"
              >
                {strings.settings.title}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="btn-icon"
                aria-label={strings.chrome.closeSettings}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-auto p-4 text-sm">
              <Toggle
                label={strings.clock.showSeconds}
                checked={settings.showSeconds}
                onChange={(v) => update({ showSeconds: v })}
              />
              <Toggle
                label={strings.clock.timerMode}
                checked={settings.showTimer}
                onChange={(v) => update({ showTimer: v })}
              />

              <fieldset className="space-y-2 border-0 p-0">
                <legend className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                  {strings.clock.clockStyle}
                </legend>
                <div className="flex flex-col gap-1.5">
                  {CLOCK_STYLES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => update({ clockStyle: s.id })}
                      className={`list-row ${settings.clockStyle === s.id ? "" : ""}`}
                      data-active={settings.clockStyle === s.id}
                      aria-pressed={settings.clockStyle === s.id}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-2 border-0 p-0">
                <legend className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                  {strings.clock.timeFormat}
                </legend>
                <div className="nav-pill w-full justify-between">
                  {(
                    [
                      ["system", strings.clock.system],
                      ["12", strings.clock.hour12],
                      ["24", strings.clock.hour24],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className="nav-pill__item flex-1 border-0 bg-transparent"
                      data-active={settings.hour12 === id}
                      aria-pressed={settings.hour12 === id}
                      onClick={() => update({ hour12: id })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-2 border-0 p-0">
                <legend className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                  {strings.night.label}
                </legend>
                <div className="nav-pill w-full justify-between">
                  {(
                    [
                      ["off", strings.night.off],
                      ["auto", strings.night.auto],
                      ["on", strings.night.on],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className="nav-pill__item flex-1 border-0 bg-transparent"
                      data-active={settings.nightMode === id}
                      aria-pressed={settings.nightMode === id}
                      onClick={() => update({ nightMode: id })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {settings.nightMode === "auto" && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="text-xs text-muted">
                      {strings.night.start}
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={settings.nightStartHour}
                        onChange={(e) =>
                          update({
                            nightStartHour: clampHour(Number(e.target.value)),
                          })
                        }
                        className="field mt-1"
                      />
                    </label>
                    <label className="text-xs text-muted">
                      {strings.night.end}
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={settings.nightEndHour}
                        onChange={(e) =>
                          update({
                            nightEndHour: clampHour(Number(e.target.value)),
                          })
                        }
                        className="field mt-1"
                      />
                    </label>
                  </div>
                )}
              </fieldset>

              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                  {strings.settings.accent}
                </p>
                <div className="flex gap-2">
                  {ACCENT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      title={p.label}
                      onClick={() => update({ accent: p.id })}
                      className={`h-7 w-7 rounded-full transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                        settings.accent === p.id
                          ? "scale-105 ring-2 ring-white ring-offset-2 ring-offset-(--focus-ring-offset)"
                          : "ring-2 ring-transparent hover:scale-105"
                      }`}
                      style={{ background: p.value }}
                      aria-label={`Accent ${p.label}`}
                      aria-pressed={settings.accent === p.id}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary w-full justify-start rounded-md"
                onClick={() => {
                  setOpen(false);
                  onChooseRepos();
                }}
              >
                {strings.settings.chooseRepos}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void disconnect()}
                className="btn btn-danger w-full justify-start rounded-md"
              >
                {strings.settings.disconnect}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function clampHour(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(23, Math.max(0, Math.round(n)));
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
      <span className="font-medium text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="switch"
      >
        <span className="switch__thumb" />
      </button>
    </label>
  );
}
