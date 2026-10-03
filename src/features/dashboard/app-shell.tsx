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
  Github,
  Maximize2,
  Minimize2,
  Moon,
  MonitorSmartphone,
  Settings,
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
import { useSettings } from "@/features/settings/settings-provider";
import { AmbientBackground } from "@/features/shell/ambient";
import { BrandMark } from "@/features/shell/brand-mark";
import { snappy, soft, useMotionSafe } from "@/features/motion/provider";
import { useGlassSheen } from "@/lib/glass-sheen";
import { strings } from "@/lib/strings";

const FOOTER = {
  repo: "https://github.com/MohammadTahaBatoomi/Perch",
  site: "https://cipherunit.xyz/",
  github: "https://github.com/MohammadTahaBatoomi",
} as const;

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
    <nav
      ref={trackRef}
      className="relative inline-flex items-center gap-[0.15rem] rounded-full bg-[color-mix(in_oklab,#000000_28%,transparent)] p-[0.15rem] shadow-[inset_0_0_0_1px_var(--glass-border)]"
      aria-label={strings.nav.primary}
    >
      <span
        className="pointer-events-none absolute inset-y-[0.15rem] rounded-full bg-[color-mix(in_oklab,#ffffff_12%,transparent)] shadow-[inset_0_1px_0_0_var(--glass-highlight),inset_0_0_0_1px_var(--glass-border)] transition-[inset-inline-start,width] duration-[var(--duration-med)] ease-[var(--ease-spring)] motion-reduce:transition-none"
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
            className="relative z-1 rounded-full px-[0.7rem] py-[0.3rem] text-[0.6875rem] font-medium text-muted no-underline transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-foreground data-[active=true]:font-semibold data-[active=true]:text-foreground"
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings } = useSettings();
  const { status: wakeStatus } = useKeepAwake();
  const { active: fs, toggle: toggleFs } = useFullscreen();
  const shift = useBurnInShift();
  const condensed = useCondensedHeader();
  const headerRef = useGlassSheen<HTMLElement>();
  const footerRef = useGlassSheen<HTMLElement>();
  const motionSafe = useMotionSafe();
  const hideHeader = settings.hideHeader;
  const hideFooter = settings.hideFooter;
  const chromeTransition = motionSafe ? soft : { duration: 0 };

  return (
    <ShellCtx.Provider value={{ openRepos: () => setReposOpen(true) }}>
      <AmbientBackground />
      <div
        className="relative z-[var(--z-content)] flex h-dvh w-full flex-col overflow-hidden text-foreground"
        style={{
          transform: `translate(${shift.x}px, ${shift.y}px)`,
          transition: "transform 1.2s ease",
        }}
      >
        <m.div
          className="grid shrink-0"
          initial={false}
          animate={{ gridTemplateRows: hideHeader ? "0fr" : "1fr" }}
          transition={chromeTransition}
          aria-hidden={hideHeader || undefined}
          {...(hideHeader ? { inert: true } : {})}
        >
          <div className="min-h-0 overflow-hidden">
            <m.header
              ref={headerRef}
              initial={false}
              animate={
                hideHeader
                  ? { y: "-110%", opacity: 0 }
                  : { y: 0, opacity: 1 }
              }
              transition={chromeTransition}
              className="glass-nav glass-sheen relative z-[var(--z-nav)] mx-[0.55rem] mt-[0.45rem] flex min-h-[2.35rem] items-center gap-2 px-[6px] py-[0.3rem] transition-[margin,padding,min-height,border-radius] duration-[var(--duration-med)] ease-[var(--ease-spring)] data-[condensed=true]:mx-[0.4rem] data-[condensed=true]:mt-1 data-[condensed=true]:min-h-8 data-[condensed=true]:py-[0.2rem]"
              data-condensed={condensed}
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-mono text-sm font-[650] tracking-[0.04em] text-accent no-underline [text-shadow:0_0_14px_color-mix(in_oklab,var(--accent)_28%,transparent)]"
              >
                <BrandMark className="size-5 shrink-0" />
                {strings.app.name}
              </Link>
              <NavPills />
              <div className="ms-auto flex items-center gap-1.5">
                <WakeIndicator status={wakeStatus} />
                <button
                  type="button"
                  onClick={() => void toggleFs()}
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-muted transition-[transform,background,color] duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:scale-[1.04] hover:bg-[color-mix(in_oklab,#ffffff_10%,transparent)] hover:text-foreground active:scale-[0.94] motion-reduce:transform-none"
                  aria-label={
                    fs
                      ? strings.chrome.exitFullscreen
                      : strings.chrome.enterFullscreen
                  }
                >
                  {fs ? (
                    <Minimize2 size={14} strokeWidth={2} />
                  ) : (
                    <Maximize2 size={14} strokeWidth={2} />
                  )}
                </button>
                <SettingsDrawer
                  onChooseRepos={() => setReposOpen(true)}
                  open={settingsOpen}
                  onOpenChange={setSettingsOpen}
                  showTrigger={!hideHeader}
                />
              </div>
            </m.header>
          </div>
        </m.div>

        <AnimatePresence>
          {hideHeader && (
            <m.button
              key="settings-fab"
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="pointer-events-auto fixed top-[0.45rem] start-[0.55rem] z-[var(--z-nav)] inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-[color-mix(in_oklab,#000000_40%,transparent)] p-0 text-muted shadow-[inset_0_0_0_1px_var(--glass-border)] transition-[transform,background,color] duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:scale-[1.04] hover:bg-[color-mix(in_oklab,#ffffff_10%,transparent)] hover:text-foreground active:scale-[0.94]"
              initial={motionSafe ? { opacity: 0, y: -10 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={motionSafe ? { opacity: 0, y: -10 } : undefined}
              transition={chromeTransition}
              aria-label={strings.chrome.settings}
              aria-expanded={settingsOpen}
              aria-haspopup="dialog"
            >
              <Settings size={16} strokeWidth={2} />
            </m.button>
          )}
        </AnimatePresence>

        <main className="relative z-[var(--z-content)] min-h-0 flex-1 px-[0.55rem] pt-[0.45rem] pb-[0.35rem]">
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

        <m.div
          className="grid shrink-0"
          initial={false}
          animate={{ gridTemplateRows: hideFooter ? "0fr" : "1fr" }}
          transition={chromeTransition}
          aria-hidden={hideFooter || undefined}
          {...(hideFooter ? { inert: true } : {})}
        >
          <div className="min-h-0 overflow-hidden">
            <m.footer
              ref={footerRef}
              initial={false}
              animate={
                hideFooter
                  ? { y: "110%", opacity: 0 }
                  : { y: 0, opacity: 1 }
              }
              transition={chromeTransition}
              className="glass-nav glass-sheen relative z-[var(--z-nav)] mx-[0.55rem] mt-[0.45rem] mb-[0.45rem] flex min-h-[2.35rem] shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-[0.35rem] px-[6px] py-[0.3rem]"
            >
              <nav
                className="inline-flex flex-wrap items-center gap-[0.4rem]"
                aria-label="Credits"
              >
                <Link
                  href={FOOTER.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-[0.28rem] text-[0.625rem] font-[550] tracking-[0.02em] text-muted/88 no-underline underline-offset-[0.16em] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-accent hover:underline hover:decoration-[color-mix(in_oklab,var(--accent)_45%,transparent)] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  <Github size={11} strokeWidth={2} aria-hidden />
                  {strings.footer.repo}
                </Link>
                <span
                  className="size-[3px] rounded-full bg-[color-mix(in_oklab,#ffffff_18%,transparent)]"
                  aria-hidden
                />
                <Link
                  href={FOOTER.site}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-[0.28rem] text-[0.625rem] font-[550] tracking-[0.02em] text-muted/88 no-underline underline-offset-[0.16em] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-accent hover:underline hover:decoration-[color-mix(in_oklab,var(--accent)_45%,transparent)] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  {strings.footer.site}
                </Link>
                <span
                  className="size-[3px] rounded-full bg-[color-mix(in_oklab,#ffffff_18%,transparent)]"
                  aria-hidden
                />
                <Link
                  href={FOOTER.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-[0.28rem] text-[0.625rem] font-[550] tracking-[0.02em] text-muted/88 no-underline underline-offset-[0.16em] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-accent hover:underline hover:decoration-[color-mix(in_oklab,var(--accent)_45%,transparent)] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  {strings.footer.github}
                </Link>
              </nav>
              <p className="m-0 text-[0.5625rem] font-medium tracking-[0.01em] text-muted/72 text-balance">
                {strings.footer.credit}
              </p>
            </m.footer>
          </div>
        </m.div>

        <RepoSelectSheet open={reposOpen} onClose={() => setReposOpen(false)} />
        <Moon className="sr-only" aria-hidden />
      </div>
    </ShellCtx.Provider>
  );
}
