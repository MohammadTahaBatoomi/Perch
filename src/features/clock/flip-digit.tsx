"use client";

import { useEffect, useState } from "react";

function shouldSkipFlip(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (document.documentElement.dataset.nightMode === "1") return true;
  return false;
}

/**
 * Single digit with translateY + opacity flip when the value changes.
 * Instant swap under reduced-motion or StandBy night mode (no stacked layers).
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

    if (shouldSkipFlip()) {
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

  // Drop any in-flight outgoing layer when night mode turns on mid-flip
  useEffect(() => {
    const sync = () => {
      if (document.documentElement.dataset.nightMode === "1") {
        setOutgoing(null);
      }
    };
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-night-mode"],
    });
    return () => obs.disconnect();
  }, []);

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
