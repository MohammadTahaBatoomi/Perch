"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "motion/react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { FlipDigit } from "./flip-digit";
import { useSettings } from "@/features/settings/settings-provider";
import {
  snappy,
  soft,
  useMotionSafe,
} from "@/features/motion/provider";
import { pad2 } from "@/lib/format";
import {
  TIMER_PRESETS,
  timerPresetLabel,
  type TimerMinutes,
} from "@/lib/settings";
import { strings } from "@/lib/strings";

const ALARM_SRC = "/audio/timer-alarm.mp3";
const ALARM_MS = 15_000;

/**
 * Compact StandBy timer — large mm:ss + thin SVG progress ring.
 * Transform/opacity only for animations.
 */
export function StandbyTimer() {
  const { settings, update } = useSettings();
  const total = settings.timerMinutes * 60;
  const [seconds, setSeconds] = useState(total);
  const [running, setRunning] = useState(false);
  const [alarmOpen, setAlarmOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const endAt = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmStopRef = useRef<number | null>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const motionSafe = useMotionSafe();

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  // Sync duration when preset changes (and timer is idle / unused).
  useEffect(() => {
    if (running) return;
    setSeconds(total);
    endAt.current = null;
  }, [total, running]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (endAt.current == null) return;
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0) {
        setRunning(false);
        endAt.current = null;
        setAlarmOpen(true);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const dismissAlarm = useCallback(() => {
    if (alarmStopRef.current != null) {
      window.clearTimeout(alarmStopRef.current);
      alarmStopRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setAlarmOpen(false);
  }, []);

  // Play alarm (up to 15s) when the done modal opens; honor settings.timerSound.
  useEffect(() => {
    if (!alarmOpen) return;

    if (settings.timerSound) {
      if (!audioRef.current) {
        audioRef.current = new Audio(ALARM_SRC);
        audioRef.current.preload = "auto";
      }
      const audio = audioRef.current;
      audio.currentTime = 0;
      void audio.play().catch(() => {
        /* autoplay may be blocked; modal still lets the user dismiss */
      });
      alarmStopRef.current = window.setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        alarmStopRef.current = null;
      }, ALARM_MS);
    }

    return () => {
      if (alarmStopRef.current != null) {
        window.clearTimeout(alarmStopRef.current);
        alarmStopRef.current = null;
      }
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [alarmOpen, settings.timerSound]);

  useEffect(() => {
    if (!alarmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissAlarm();
    };
    window.addEventListener("keydown", onKey);
    dismissRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [alarmOpen, dismissAlarm]);

  const toggle = useCallback(() => {
    setRunning((r) => {
      if (!r) {
        // Unlock audio on the user gesture so playback works when time is up.
        if (settings.timerSound) {
          if (!audioRef.current) {
            audioRef.current = new Audio(ALARM_SRC);
            audioRef.current.preload = "auto";
          }
          const audio = audioRef.current;
          audio.muted = true;
          void audio
            .play()
            .then(() => {
              audio.pause();
              audio.currentTime = 0;
              audio.muted = false;
            })
            .catch(() => {
              audio.muted = false;
            });
        }
        endAt.current = Date.now() + seconds * 1000;
        return true;
      }
      if (endAt.current) {
        setSeconds(Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000)));
      }
      endAt.current = null;
      return false;
    });
  }, [seconds, settings.timerSound]);

  const reset = useCallback(() => {
    setRunning(false);
    endAt.current = null;
    setSeconds(total);
  }, [total]);

  const pickDuration = useCallback(
    (mins: TimerMinutes) => {
      update({ timerMinutes: mins });
      setRunning(false);
      endAt.current = null;
      setSeconds(mins * 60);
    },
    [update],
  );

  const mm = pad2(Math.floor(seconds / 60));
  const ss = pad2(seconds % 60);
  const progress = total > 0 ? seconds / total : 0;
  const circumference = 2 * Math.PI * 46;
  const dash = circumference * progress;

  const alarmModal =
    mounted &&
    createPortal(
      <AnimatePresence>
        {alarmOpen && (
          <m.div
            key="timer-alarm-scrim"
            className="fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-[var(--scrim)] p-4"
            role="presentation"
            initial={motionSafe ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={motionSafe ? { opacity: 0 } : undefined}
            transition={snappy}
            onClick={(e) => {
              if (e.target === e.currentTarget) dismissAlarm();
            }}
          >
            <m.div
              className="glass-elevated flex w-full max-w-sm flex-col overflow-hidden rounded-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={
                motionSafe ? { opacity: 0, y: 28, scale: 0.94 } : false
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                motionSafe
                  ? { opacity: 0, y: 16, scale: 0.96 }
                  : undefined
              }
              transition={soft}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1 px-5 pt-5 pb-2">
                <h2
                  id={titleId}
                  className="text-base font-semibold tracking-tight text-foreground"
                >
                  {strings.clock.timerDone}
                </h2>
                <p className="text-sm text-muted">{strings.clock.timerDoneHint}</p>
              </div>
              <div className="px-5 pb-5 pt-3">
                <button
                  ref={dismissRef}
                  type="button"
                  onClick={dismissAlarm}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border-none bg-[color-mix(in_oklab,var(--accent)_85%,white)] px-[1.05rem] py-2.5 text-[length:var(--text-body)] font-semibold leading-tight tracking-[-0.01em] text-[color-mix(in_oklab,#000000_82%,transparent)] shadow-[inset_0_1px_0_0_color-mix(in_oklab,#ffffff_35%,transparent),inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_35%,transparent),0_4px_14px_-6px_color-mix(in_oklab,var(--accent)_35%,transparent)] transition-[transform,filter] duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:brightness-105 active:scale-[0.97]"
                >
                  {strings.clock.dismissAlarm}
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>,
      document.body,
    );

  return (
    <div className="standby-timer">
      <div className="standby-timer__ring-wrap">
        <svg className="standby-timer__ring" viewBox="0 0 100 100" aria-hidden>
          <circle
            className="standby-timer__track"
            cx="50"
            cy="50"
            r="46"
            fill="none"
          />
          <circle
            className="standby-timer__progress"
            cx="50"
            cy="50"
            r="46"
            fill="none"
            strokeDasharray={`${dash} ${circumference}`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="standby-digital standby-digital--glass standby-timer__digits">
          <div className="standby-digital__time standby-digital__time--timer">
            <FlipDigit value={mm[0]!} />
            <FlipDigit value={mm[1]!} />
            <span className="standby-colon standby-colon--on" aria-hidden>
              <span className="standby-colon__dot" />
              <span className="standby-colon__dot" />
            </span>
            <FlipDigit value={ss[0]!} />
            <FlipDigit value={ss[1]!} />
          </div>
        </div>
      </div>

      <div
        className="standby-timer__presets"
        role="group"
        aria-label={strings.clock.timerDuration}
      >
        {TIMER_PRESETS.map((mins) => (
          <button
            key={mins}
            type="button"
            className="standby-timer__preset"
            data-active={settings.timerMinutes === mins}
            aria-pressed={settings.timerMinutes === mins}
            disabled={running}
            onClick={() => pickDuration(mins)}
          >
            {timerPresetLabel(mins)}
          </button>
        ))}
      </div>

      <div className="standby-timer__controls">
        <button
          type="button"
          className="standby-timer__btn inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border-none bg-[var(--glass-bg)] px-[1.05rem] py-2 text-[length:var(--text-body)] font-semibold leading-tight tracking-[-0.01em] text-foreground shadow-[inset_0_1px_0_0_var(--glass-highlight),inset_0_0_0_1px_var(--glass-border),0_4px_14px_-6px_var(--glass-shadow-sm)]"
          onClick={toggle}
          aria-label={
            running ? strings.clock.pauseTimer : strings.clock.startTimer
          }
        >
          {running ? (
            <Pause size={16} strokeWidth={2} />
          ) : (
            <Play size={16} strokeWidth={2} />
          )}
        </button>
        <button
          type="button"
          className="standby-timer__btn inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border-none bg-[var(--glass-bg)] px-[1.05rem] py-2 text-[length:var(--text-body)] font-semibold leading-tight tracking-[-0.01em] text-foreground shadow-[inset_0_1px_0_0_var(--glass-highlight),inset_0_0_0_1px_var(--glass-border),0_4px_14px_-6px_var(--glass-shadow-sm)]"
          onClick={reset}
          aria-label={strings.clock.resetTimer}
        >
          <RotateCcw size={16} strokeWidth={2} />
        </button>
      </div>

      {alarmModal}
    </div>
  );
}
