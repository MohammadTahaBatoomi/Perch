"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { pad2 } from "@/lib/format";
import { strings } from "@/lib/strings";

const WORK = 25 * 60;
const BREAK = 5 * 60;

export function PomodoroBar() {
  const [mode, setMode] = useState<"work" | "break">("work");
  const [seconds, setSeconds] = useState(WORK);
  const [running, setRunning] = useState(false);
  const [flash, setFlash] = useState(false);
  const endAt = useRef<number | null>(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (endAt.current == null) return;
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0) {
        setRunning(false);
        endAt.current = null;
        setFlash(true);
        window.setTimeout(() => setFlash(false), 1800);
        const nextMode = modeRef.current === "work" ? "break" : "work";
        setMode(nextMode);
        setSeconds(nextMode === "work" ? WORK : BREAK);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const toggle = useCallback(() => {
    setRunning((r) => {
      if (!r) {
        endAt.current = Date.now() + seconds * 1000;
        return true;
      }
      if (endAt.current) {
        setSeconds(Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000)));
      }
      endAt.current = null;
      return false;
    });
  }, [seconds]);

  const reset = useCallback(() => {
    setRunning(false);
    endAt.current = null;
    setSeconds(mode === "work" ? WORK : BREAK);
  }, [mode]);

  const mm = pad2(Math.floor(seconds / 60));
  const ss = pad2(seconds % 60);

  return (
    <div
      className={`glass-clear flex items-center gap-2 rounded-[var(--radius-pill)] px-2.5 py-1 text-sm transition-colors ${
        flash ? "bg-[color-mix(in_oklab,var(--accent)_35%,transparent)]" : ""
      }`}
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
        {mode === "work" ? strings.pomodoro.focus : strings.pomodoro.break}
      </span>
      <span className="font-mono tabular-nums text-foreground">
        {mm}:{ss}
      </span>
      <button
        type="button"
        onClick={toggle}
        className="btn-icon"
        aria-label={running ? strings.pomodoro.pause : strings.pomodoro.start}
      >
        {running ? (
          <Pause size={14} strokeWidth={2} />
        ) : (
          <Play size={14} strokeWidth={2} />
        )}
      </button>
      <button
        type="button"
        onClick={reset}
        className="btn-icon"
        aria-label={strings.pomodoro.reset}
      >
        <RotateCcw size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
