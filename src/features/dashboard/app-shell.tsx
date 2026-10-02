"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

const NAV = [
  { href: "/", label: "Home" },
  { href: "/activity", label: "Activity" },
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
      label: "Awake",
      className: "text-emerald-400",
    },
    fallback: {
      icon: MonitorSmartphone,
      label: "Fallback",
      className: "text-amber-400",
    },
    unavailable: {
      icon: ShieldOff,
      label: "No wake lock",
      className: "text-red-400",
    },
    idle: {
      icon: ShieldAlert,
      label: "Tap to keep awake",
      className: "text-zinc-500",
    },
  } as const;
  const m = map[status];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] ${m.className}`}
      title={
        status === "unavailable"
          ? "Wake Lock needs a secure context (HTTPS). Using plain HTTP on LAN often blocks it."
          : undefined
      }
    >
      <Icon size={12} />
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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [reposOpen, setReposOpen] = useState(false);
  const { status: wakeStatus } = useKeepAwake();
  const { active: fs, toggle: toggleFs } = useFullscreen();
  const shift = useBurnInShift();

  return (
    <ShellCtx.Provider value={{ openRepos: () => setReposOpen(true) }}>
      <div
        className="flex h-dvh w-full flex-col overflow-hidden bg-black text-zinc-100"
        style={{
          transform: `translate(${shift.x}px, ${shift.y}px)`,
          transition: "transform 1.2s ease",
        }}
      >
        <header className="flex h-9 shrink-0 items-center gap-2 border-b border-zinc-900 px-2">
          <Link
            href="/"
            className="font-mono text-xs font-semibold tracking-wide"
            style={{ color: "var(--accent)" }}
          >
            Perch
          </Link>
          <nav className="ml-2 flex gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded px-2 py-0.5 text-[11px] ${
                    active
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <WakeIndicator status={wakeStatus} />
            <button
              type="button"
              onClick={() => void toggleFs()}
              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              aria-label={fs ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {fs ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <SettingsDrawer onChooseRepos={() => setReposOpen(true)} />
          </div>
        </header>

        <main className="min-h-0 flex-1 p-2">{children}</main>

        <RepoSelectSheet open={reposOpen} onClose={() => setReposOpen(false)} />

        <div
          className="pointer-events-none fixed inset-0 z-40 bg-black transition-opacity duration-700"
          style={{ opacity: "var(--night-dim-opacity, 0)" }}
          aria-hidden
        />
        <Moon className="sr-only" />
      </div>
    </ShellCtx.Provider>
  );
}
