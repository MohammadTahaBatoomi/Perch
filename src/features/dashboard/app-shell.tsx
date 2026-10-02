"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import {
  Maximize2,
  Minimize2,
  Moon,
  MonitorSmartphone,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import {
  useFullscreen,
  useKeepAwake,
  type WakeStatus,
} from "@/features/clock/keep-awake";
import { RepoSelectSheet } from "@/features/github/github-card";
import { SettingsDrawer } from "@/features/settings/settings-drawer";
import { AmbientBackground } from "@/features/shell/ambient";
import { snappy, useMotionSafe } from "@/features/motion/provider";
import { useGlassSheen } from "@/lib/glass-sheen";
import { strings } from "@/lib/strings";

const NAV = [
  { href: "/", label: strings.nav.home },
  { href: "/clock", label: strings.nav.clock },
  { href: "/activity", label: strings.nav.activity },
] as const;

const ShellCtx = createContext<{ openRepos: () => void } | null>(null);

export function useShell() {
  const ctx = useContext(ShellCtx);
  if (!ctx) throw new Error("useShell must be used within AppShell");
  return ctx;
}

function WakeIndicator({ status }: { status: WakeStatus }) {
  const map = {
    active: {
      icon: ShieldCheck,
      label: strings.wake.active,
      className: "text-success",
    },
    fallback: {
      icon: MonitorSmartphone,
      label: strings.wake.fallback,
      className: "text-warning",
    },
    unavailable: {
      icon: ShieldOff,
      label: strings.wake.unavailable,
      className: "text-danger",
    },
    idle: {
      icon: ShieldAlert,
      label: strings.wake.idle,
      className: "text-muted",
    },
  } as const;
  const m = map[status];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium ${m.className}`}
      title={
        status === "unavailable" ? strings.wake.unavailableHint : undefined
      }
    >
      <Icon size={12} strokeWidth={2} />
      {m.label}
    </span>
  );
}

function useBurnInShift() {
  const [shift, setShift] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const id = setInterval(() => {
      setShift({
        x: Math.floor(Math.random() * 5) - 2,
        y: Math.floor(Math.random() * 5) - 2,
      });
    }, 3 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return shift;
}

function useCondensedHeader() {
  const [condensed, setCondensed] = useState(false);
  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return condensed;
}

function NavPills() {
  const pathname = usePathname();
  const trackRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [thumb, setThumb] = useState({ start: 0, width: 0 });

  const activeIndex = NAV.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );

  useLayoutEffect(() => {
    const el = itemRefs.current[activeIndex >= 0 ? activeIndex : 0];
    const track = trackRef.current;
    if (!el || !track) return;
    const trackBox = track.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    setThumb({
      start: box.left - trackBox.left,
      width: box.width,
    });
  }, [activeIndex, pathname]);

  return (
    <nav ref={trackRef} className="nav-pill" aria-label={strings.nav.primary}>
      <span
        className="nav-pill__thumb"
        style={{
          insetInlineStart: thumb.start,
          width: thumb.width,
        }}
        aria-hidden
      />
      {NAV.map((item, i) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            ref={(node) => {
              itemRefs.current[i] = node;
            }}
            data-active={active}
            className="nav-pill__item"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [reposOpen, setReposOpen] = useState(false);
  const { status: wakeStatus } = useKeepAwake();
  const { active: fs, toggle: toggleFs } = useFullscreen();
  const shift = useBurnInShift();
  const condensed = useCondensedHeader();
  const headerRef = useGlassSheen<HTMLElement>();
  const motionSafe = useMotionSafe();

  return (
    <ShellCtx.Provider value={{ openRepos: () => setReposOpen(true) }}>
      <AmbientBackground />
      <div
        className="shell"
        style={{
          transform: `translate(${shift.x}px, ${shift.y}px)`,
          transition: "transform 1.2s ease",
        }}
      >
        <header
          ref={headerRef}
          className="shell__header glass-nav glass-sheen"
          data-condensed={condensed}
        >
          <Link href="/" className="brand">
            {strings.app.name}
          </Link>
          <NavPills />
          <div className="ms-auto flex items-center gap-1.5">
            <WakeIndicator status={wakeStatus} />
            <button
              type="button"
              onClick={() => void toggleFs()}
              className="btn-icon"
              aria-label={
                fs
                  ? strings.chrome.exitFullscreen
                  : strings.chrome.enterFullscreen
              }
            >
              {fs ? <Minimize2 size={14} strokeWidth={2} /> : <Maximize2 size={14} strokeWidth={2} />}
            </button>
            <SettingsDrawer onChooseRepos={() => setReposOpen(true)} />
          </div>
        </header>

        <main className="shell__main">
          <AnimatePresence mode="sync" initial={false}>
            <m.div
              key={pathname}
              className="h-full min-h-0"
              initial={motionSafe ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={motionSafe ? { opacity: 0, y: -6 } : undefined}
              transition={snappy}
            >
              {children}
            </m.div>
          </AnimatePresence>
        </main>

        <RepoSelectSheet open={reposOpen} onClose={() => setReposOpen(false)} />
        <Moon className="sr-only" />
      </div>
    </ShellCtx.Provider>
  );
}
