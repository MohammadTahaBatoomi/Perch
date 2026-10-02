"use client";

import { FlipDigit } from "./flip-digit";
import { pad2 } from "@/lib/format";

type Props = {
  hours: number;
  minutes: number;
  seconds: number;
  showSeconds: boolean;
  hour12: boolean;
  style: "glass" | "solid";
};

export function DigitalClock({
  hours,
  minutes,
  seconds,
  showSeconds,
  hour12,
  style,
}: Props) {
  let displayH = hours;
  let period: "AM" | "PM" | null = null;
  if (hour12) {
    period = hours >= 12 ? "PM" : "AM";
    displayH = hours % 12;
    if (displayH === 0) displayH = 12;
  }

  const h = pad2(displayH);
  const m = pad2(minutes);
  const s = pad2(seconds);
  const pulse = seconds % 2 === 0;

  return (
    <div
      className={`standby-digital standby-digital--${style}`}
      data-style={style}
    >
      <div className="standby-digital__time">
        <FlipDigit value={h[0]!} />
        <FlipDigit value={h[1]!} />
        <span
          className={`standby-colon ${pulse ? "standby-colon--on" : "standby-colon--off"}`}
          aria-hidden
        >
          :
        </span>
        <FlipDigit value={m[0]!} />
        <FlipDigit value={m[1]!} />
        {showSeconds && (
          <>
            <span className="standby-colon standby-colon--seconds" aria-hidden>
              :
            </span>
            <span className="standby-seconds">
              <FlipDigit value={s[0]!} />
              <FlipDigit value={s[1]!} />
            </span>
          </>
        )}
        {period && <span className="standby-period">{period}</span>}
      </div>
    </div>
  );
}
