"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { FlipDigit } from "./flip-digit";
import { pad2 } from "@/lib/format";
import { strings } from "@/lib/strings";

const DEFAULT_SECONDS = 25 * 60;

/**
 * Compact StandBy timer — large mm:ss + thin SVG progress ring.
 * Transform/opacity only for animations.
 */
export function StandbyTimer() {
  const [total] = useState(DEFAULT_SECONDS);
  const [seconds, setSeconds] = useState(DEFAULT_SECONDS);
  const [running, setRunning] = useState(false);
  const endAt = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (endAt.current == null) return;
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0) {
        setRunning(false);
        endAt.current = null;
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
    setSeconds(total);
  }, [total]);

  const mm = pad2(Math.floor(seconds / 60));
  const ss = pad2(seconds % 60);
  const progress = total > 0 ? seconds / total : 0;
  const circumference = 2 * Math.PI * 46;
  const dash = circumference * progress;

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
      <div className="standby-timer__controls">
        <button
          type="button"
          className="btn-secondary standby-timer__btn"
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
          className="btn-secondary standby-timer__btn"
          onClick={reset}
          aria-label={strings.clock.resetTimer}
        >
          <RotateCcw size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
