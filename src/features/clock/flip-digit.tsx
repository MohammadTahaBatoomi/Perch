"use client";

import { useEffect, useState } from "react";

/**
 * Single digit with translateY + opacity flip when the value changes.
 * Respects prefers-reduced-motion (instant swap).
 */
export function FlipDigit({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const [current, setCurrent] = useState(value);
  const [outgoing, setOutgoing] = useState<string | null>(null);

  useEffect(() => {
    if (value === current) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      const t = window.setTimeout(() => {
        setCurrent(value);
        setOutgoing(null);
      }, 0);
      return () => clearTimeout(t);
    }

    const t = window.setTimeout(() => {
      setOutgoing(current);
      setCurrent(value);
    }, 0);
    const clear = window.setTimeout(() => setOutgoing(null), 260);
    return () => {
      clearTimeout(t);
      clearTimeout(clear);
    };
  }, [value, current]);

  return (
    <span className={`standby-digit-slot ${className}`} aria-hidden>
      {outgoing !== null && (
        <span className="standby-digit standby-digit--out" key={`o-${outgoing}`}>
          {outgoing}
        </span>
      )}
      <span
        className={`standby-digit ${outgoing !== null ? "standby-digit--in" : ""}`}
        key={`c-${current}`}
      >
        {current}
      </span>
    </span>
  );
}
