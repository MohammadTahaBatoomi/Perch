"use client";

import { useEffect, useState } from "react";
import {
  LazyMotion,
  domAnimation,
  MotionConfig,
  type Transition,
} from "motion/react";

/** Short tween — transform/opacity only, cheap on old phones */
export const snappy: Transition = {
  type: "tween",
  duration: 0.22,
  ease: [0.2, 0.8, 0.2, 1],
};

export const soft: Transition = {
  type: "tween",
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1],
};

export const switchSpring: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 38,
  mass: 0.6,
};

export function useReducedMotionPref(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    const t = window.setTimeout(sync, 0);
    mq.addEventListener("change", sync);
    return () => {
      clearTimeout(t);
      mq.removeEventListener("change", sync);
    };
  }, []);

  return reduced;
}

/** Skip decorative motion in night mode (OLED / battery) */
export function useNightMotionOff(): boolean {
  const [off, setOff] = useState(false);

  useEffect(() => {
    const sync = () =>
      setOff(document.documentElement.dataset.nightMode === "1");
    const t = window.setTimeout(sync, 0);
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-night-mode"],
    });
    return () => {
      clearTimeout(t);
      obs.disconnect();
    };
  }, []);

  return off;
}

export function useMotionSafe(): boolean {
  const reduced = useReducedMotionPref();
  const nightOff = useNightMotionOff();
  return !reduced && !nightOff;
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
