"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type WakeStatus = "active" | "fallback" | "unavailable" | "idle";

/**
 * Screen Wake Lock with NoSleep-style muted video fallback for insecure contexts.
 */
export function useKeepAwake() {
  const [status, setStatus] = useState<WakeStatus>("idle");
  const lockRef = useRef<WakeLockSentinel | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wantedRef = useRef(true);

  const startFallback = useCallback(async () => {
    let video = videoRef.current;
    if (!video) {
      video = document.createElement("video");
      video.setAttribute("playsinline", "");
      video.setAttribute("muted", "");
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.src = FALLBACK_VIDEO_SRC;
      video.style.position = "fixed";
      video.style.width = "1px";
      video.style.height = "1px";
      video.style.opacity = "0";
      video.style.pointerEvents = "none";
      video.style.bottom = "0";
      video.style.left = "0";
      document.body.appendChild(video);
      videoRef.current = video;
    }
    try {
      await video.play();
      setStatus("fallback");
    } catch {
      setStatus("unavailable");
    }
  }, []);

  const acquire = useCallback(async () => {
    if (!wantedRef.current) return;
    const canWakeLock =
      typeof navigator !== "undefined" &&
      "wakeLock" in navigator &&
      window.isSecureContext;

    if (canWakeLock) {
      try {
        lockRef.current = await navigator.wakeLock.request("screen");
        lockRef.current.addEventListener("release", () => {
          if (wantedRef.current) setStatus("idle");
        });
        setStatus("active");
        return;
      } catch {
        // fall through to video fallback
      }
    }
    await startFallback();
  }, [startFallback]);

  const release = useCallback(async () => {
    wantedRef.current = false;
    try {
      await lockRef.current?.release();
    } catch {
      /* ignore */
    }
    lockRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.remove();
      videoRef.current = null;
    }
    setStatus("idle");
  }, []);

  useEffect(() => {
    wantedRef.current = true;
    const onVisibility = () => {
      if (document.visibilityState === "visible" && wantedRef.current) {
        void acquire();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onFirstTap = () => {
      void acquire();
    };
    window.addEventListener("pointerdown", onFirstTap, { once: true });

    // Defer initial attempt so setState is not sync inside the effect body.
    const t = window.setTimeout(() => {
      void acquire();
    }, 0);

    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", onFirstTap);
      void release();
    };
  }, [acquire, release]);

  return { status, acquire, release };
}

export function useFullscreen() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked without gesture / unsupported WebView
    }
  }, []);

  return { active, toggle };
}

/** Tiny silent looping MP4 data URI for keep-awake fallback on insecure HTTP. */
const FALLBACK_VIDEO_SRC =
  "data:video/mp4;base64,AAAAHGZ0eXBNNFYxAAACAE00VjFpc29tb28xAAAAzG1vbXYAAABsbXZoZAAAAAAAAAAAAAAAAAQAAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAFmdHJhawAAAFx0a2hkAAAAAwAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAABAAAAAQAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAADZtt1rFwAAABhzdHRzAAAAAAAAAAEAAAABAAAEAAAAABxzdHJ0AAAAAAAAAAEAAAABAAAAAQAAADh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAD0AAAAAABMc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAFHN0c3AAAAAAAAAAAgAAAAEAAAAcc3RzcwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0Y28AAAAAAAAAAQAAAAE=";
