"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "motion/react";
import { Settings, X } from "lucide-react";
import { ACCENT_PRESETS, CLOCK_STYLES } from "@/lib/settings";
import { strings } from "@/lib/strings";
import {
  snappy,
  soft,
  switchSpring,
  useMotionSafe,
} from "@/features/motion/provider";
import { useSettings } from "./settings-provider";

export function SettingsDrawer({
  onChooseRepos,
  open: openControlled,
  onOpenChange,
  showTrigger = true,
}: {
  onChooseRepos: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}) {
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const controlled = openControlled !== undefined;
  const open = controlled ? openControlled : openUncontrolled;
  const setOpen = (next: boolean) => {
    if (!controlled) setOpenUncontrolled(next);
    onOpenChange?.(next);
  };
  const [mounted, setMounted] = useState(false);
  const { settings, update } = useSettings();
  const [busy, setBusy] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const motionSafe = useMotionSafe();

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const panel =
    mounted &&
    createPortal(
      <AnimatePresence>
        {open && (
          <m.div
            key="settings-scrim"
            className="fixed inset-0 z-[var(--z-overlay)] flex items-stretch justify-end bg-[var(--scrim)] p-3 sm:p-4"
            role="presentation"
            initial={motionSafe ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={motionSafe ? { opacity: 0 } : undefined}
            transition={snappy}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <m.aside
              className="glass-elevated flex h-full max-h-full w-full max-w-sm flex-col rounded-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={motionSafe ? { x: "100%" } : false}
              animate={{ x: 0 }}
              exit={motionSafe ? { x: "100%" } : undefined}
              transition={soft}
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex shrink-0 items-center justify-between border-b border-[color-mix(in_oklab,#ffffff_8%,transparent)] px-4 py-3">
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
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-muted transition-[transform,background,color] duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:scale-[1.04] hover:bg-[color-mix(in_oklab,#ffffff_10%,transparent)] hover:text-foreground active:scale-[0.94]"
                  aria-label={strings.chrome.closeSettings}
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 text-sm">
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
                <Toggle
                  label={strings.chrome.hideHeader}
                  checked={settings.hideHeader}
                  onChange={(v) => update({ hideHeader: v })}
                />
                <Toggle
                  label={strings.chrome.hideFooter}
                  checked={settings.hideFooter}
                  onChange={(v) => update({ hideFooter: v })}
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
                        className="flex w-full cursor-pointer items-center justify-between rounded-[var(--radius-md)] border-none bg-transparent px-[0.6rem] py-2 text-start text-[length:var(--text-body)] text-foreground/88 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[color-mix(in_oklab,#ffffff_6%,transparent)] data-[active=true]:bg-[color-mix(in_oklab,#ffffff_11%,transparent)] data-[active=true]:text-foreground data-[active=true]:shadow-[inset_0_0_0_1px_var(--glass-border)]"
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
                  <div className="relative inline-flex w-full items-center justify-between gap-[0.15rem] rounded-full bg-[color-mix(in_oklab,#000000_28%,transparent)] p-[0.15rem] shadow-[inset_0_0_0_1px_var(--glass-border)]">
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
                        className="relative z-1 flex-1 cursor-pointer rounded-full border-0 bg-transparent px-[0.7rem] py-[0.3rem] text-[0.6875rem] font-medium text-muted transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-foreground data-[active=true]:font-semibold data-[active=true]:text-foreground"
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
                  <div className="relative inline-flex w-full items-center justify-between gap-[0.15rem] rounded-full bg-[color-mix(in_oklab,#000000_28%,transparent)] p-[0.15rem] shadow-[inset_0_0_0_1px_var(--glass-border)]">
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
                        className="relative z-1 flex-1 cursor-pointer rounded-full border-0 bg-transparent px-[0.7rem] py-[0.3rem] text-[0.6875rem] font-medium text-muted transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-foreground data-[active=true]:font-semibold data-[active=true]:text-foreground"
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
                          className="mt-1 w-full rounded-[var(--radius-md)] border-none bg-[color-mix(in_oklab,#000000_40%,transparent)] px-3 py-[0.55rem] text-[length:var(--text-body)] text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.35),inset_0_0_0_1px_var(--glass-border)] outline-none transition-[box-shadow,background] duration-[var(--duration-fast)] ease-[var(--ease-out)] placeholder:text-muted-strong focus:bg-[color-mix(in_oklab,#000000_28%,transparent)] focus:shadow-[inset_0_1px_2px_rgb(0_0_0/0.3),inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_45%,transparent),0_0_0_3px_color-mix(in_oklab,var(--accent)_22%,transparent)]"
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
                          className="mt-1 w-full rounded-[var(--radius-md)] border-none bg-[color-mix(in_oklab,#000000_40%,transparent)] px-3 py-[0.55rem] text-[length:var(--text-body)] text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.35),inset_0_0_0_1px_var(--glass-border)] outline-none transition-[box-shadow,background] duration-[var(--duration-fast)] ease-[var(--ease-out)] placeholder:text-muted-strong focus:bg-[color-mix(in_oklab,#000000_28%,transparent)] focus:shadow-[inset_0_1px_2px_rgb(0_0_0/0.3),inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_45%,transparent),0_0_0_3px_color-mix(in_oklab,var(--accent)_22%,transparent)]"
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
                  className="inline-flex w-full cursor-pointer items-center justify-start gap-1.5 rounded-md border-none bg-[var(--glass-bg)] px-[1.05rem] py-2 text-[length:var(--text-body)] font-semibold leading-tight tracking-[-0.01em] text-foreground shadow-[inset_0_1px_0_0_var(--glass-highlight),inset_0_0_0_1px_var(--glass-border),0_4px_14px_-6px_var(--glass-shadow-sm)]"
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
                  className="inline-flex w-full cursor-pointer items-center justify-start gap-1.5 rounded-md border-none bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] px-[1.05rem] py-2 text-[length:var(--text-body)] font-semibold leading-tight text-danger shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--danger)_35%,transparent)] transition-[transform,background] duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:bg-[color-mix(in_oklab,var(--danger)_18%,transparent)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:transform-none"
                >
                  {strings.settings.disconnect}
                </button>
              </div>
            </m.aside>
          </m.div>
        )}
      </AnimatePresence>,
      document.body,
    );

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-muted transition-[transform,background,color] duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:scale-[1.04] hover:bg-[color-mix(in_oklab,#ffffff_10%,transparent)] hover:text-foreground active:scale-[0.94]"
          aria-label={strings.chrome.settings}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <Settings size={16} strokeWidth={2} />
        </button>
      )}
      {panel}
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
  const motionSafe = useMotionSafe();

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="font-medium text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative h-[1.55rem] w-[2.75rem] cursor-pointer rounded-full border-none bg-[color-mix(in_oklab,#ffffff_14%,transparent)] p-0 shadow-[inset_0_1px_2px_rgb(0_0_0/0.35),inset_0_0_0_1px_var(--glass-border)] transition-colors duration-[var(--duration-med)] ease-[var(--ease-spring)] aria-checked:bg-[color-mix(in_oklab,var(--accent)_85%,white)] aria-checked:shadow-[inset_0_1px_0_0_color-mix(in_oklab,#ffffff_35%,transparent),inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_35%,transparent),0_4px_12px_-4px_color-mix(in_oklab,var(--accent)_35%,transparent)]"
      >
        <m.span
          className="absolute top-[0.15rem] start-[0.15rem] size-5 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.35),inset_0_1px_0_rgb(255_255_255/0.8)]"
          initial={false}
          animate={{ x: checked ? 19.2 : 0 }}
          transition={motionSafe ? switchSpring : { duration: 0 }}
        />
      </button>
    </label>
  );
}
