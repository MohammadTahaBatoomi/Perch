"use client";

import useSWR from "swr";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { CircleAlert, Github, Loader2, RefreshCw, Star } from "lucide-react";
import { relativeTime } from "@/lib/format";
import { strings } from "@/lib/strings";
import { snappy, soft, useReducedMotionPref } from "@/features/motion/provider";
import { useSettings } from "@/features/settings/settings-provider";
import { QrSvg } from "./qr";

type Me = { login: string; name: string | null; avatar_url: string };

type DeviceStart = {
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

type PollStatus =
  | { status: "pending" }
  | { status: "slow_down"; interval_bump: number }
  | { status: "expired" }
  | { status: "denied" }
  | { status: "error"; message: string }
  | { status: "success" };

type RepoStatus = {
  full_name: string;
  stars: number;
  open_issues: number;
  pushed_at: string | null;
  ci_status: string | null;
  ci_conclusion: string | null;
};

type Commit = {
  sha: string;
  message: string;
  repo: string;
  date: string;
  html_url: string;
};

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (res.status === 401) {
    const err = new Error("Unauthorized") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      rateLimited?: boolean;
    };
    const err = new Error(body.error ?? `HTTP ${res.status}`) as Error & {
      status: number;
      rateLimited?: boolean;
    };
    err.status = res.status;
    err.rateLimited = body.rateLimited;
    throw err;
  }
  return res.json() as Promise<T>;
}

function ciColor(status: string | null, conclusion: string | null): string {
  if (status === "in_progress" || status === "queued") return "#eab308";
  if (conclusion === "success") return "#22c55e";
  if (conclusion === "failure" || conclusion === "timed_out") return "#ef4444";
  if (!status && !conclusion) return "#71717a";
  return "#a1a1aa";
}

/**
 * Prefer web Authorize when Client Secret is configured.
 * Fall back to Device Flow (no secret) so LAN/MVP always works.
 */
function ConnectFlow({ onConnected }: { onConnected: () => void }) {
  const [mode, setMode] = useState<"choose" | "device" | "error">("choose");
  const [phase, setPhase] = useState<"idle" | "pending" | "error">("idle");
  const [flow, setFlow] = useState<DeviceStart | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef(5);
  const abortRef = useRef(false);

  const startDevice = useCallback(async () => {
    abortRef.current = false;
    setMessage(null);
    setMode("device");
    setPhase("pending");
    try {
      const res = await fetch("/api/github/device/start", { method: "POST" });
      const data = (await res.json()) as DeviceStart & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to start");
      setFlow(data);
      intervalRef.current = data.interval;
      setRemaining(data.expires_in);
    } catch (e) {
      setPhase("error");
      setMode("error");
      setMessage(e instanceof Error ? e.message : "Failed");
    }
  }, []);

  useEffect(() => {
    if (phase !== "pending" || !flow) return;
    const countdown = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(countdown);
  }, [phase, flow]);

  useEffect(() => {
    if (phase !== "pending" || !flow) return;
    abortRef.current = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (abortRef.current) return;
      try {
        const res = await fetch("/api/github/device/poll", { method: "POST" });
        const data = (await res.json()) as PollStatus & { message?: string };
        if (data.status === "success") {
          onConnected();
          return;
        }
        if (data.status === "slow_down") {
          intervalRef.current += data.interval_bump ?? 5;
        }
        if (data.status === "expired" || data.status === "denied") {
          setPhase("error");
          setMode("error");
          setMessage(
            data.status === "denied"
              ? strings.github.accessDenied
              : strings.github.codeExpired,
          );
          return;
        }
        if (data.status === "error") {
          setPhase("error");
          setMode("error");
          setMessage(data.message ?? "Error");
          return;
        }
      } catch {
        setPhase("error");
        setMode("error");
        setMessage(strings.github.networkError);
        return;
      }
      timer = setTimeout(poll, intervalRef.current * 1000);
    };

    timer = setTimeout(poll, intervalRef.current * 1000);
    return () => {
      abortRef.current = true;
      clearTimeout(timer);
    };
  }, [phase, flow, onConnected]);

  if (mode === "choose" || phase === "idle") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
        <Github className="text-muted" size={28} strokeWidth={1.75} />
        <p className="text-center text-sm text-muted">
          {strings.github.connectHint}
        </p>
        <a
          href="/api/github/oauth/start"
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border-none bg-[color-mix(in_oklab,var(--accent)_88%,white)] px-[1.05rem] py-2 text-[length:var(--text-body)] font-semibold leading-tight tracking-[-0.01em] text-accent-fg no-underline shadow-[inset_0_1px_0_0_color-mix(in_oklab,#ffffff_40%,transparent),inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_35%,transparent),0_6px_18px_-8px_color-mix(in_oklab,var(--accent)_35%,transparent)] transition-[transform,filter,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:scale-[1.02] hover:brightness-[1.08] active:scale-[0.97]"
        >
          {strings.github.connectAuthorize}
        </a>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border-none bg-transparent px-3 py-[0.4rem] text-xs font-medium leading-tight text-muted underline shadow-none transition-[transform,background,color] duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:bg-[color-mix(in_oklab,#ffffff_8%,transparent)] hover:text-foreground active:scale-[0.97]"
          onClick={() => void startDevice()}
        >
          {strings.github.useDeviceCode}
        </button>
      </div>
    );
  }

  if (mode === "error" || phase === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
        <p className="text-sm text-danger">
          {message ?? strings.github.somethingWrong}
        </p>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border-none bg-[color-mix(in_oklab,var(--accent)_88%,white)] px-[1.05rem] py-2 text-[length:var(--text-body)] font-semibold leading-tight tracking-[-0.01em] text-accent-fg shadow-[inset_0_1px_0_0_color-mix(in_oklab,#ffffff_40%,transparent),inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_35%,transparent),0_6px_18px_-8px_color-mix(in_oklab,var(--accent)_35%,transparent)] transition-[transform,filter,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:scale-[1.02] hover:brightness-[1.08] active:scale-[0.97]"
          onClick={() => {
            setMode("choose");
            setPhase("idle");
          }}
        >
          <RefreshCw size={14} className="me-1 inline" strokeWidth={2} />
          {strings.github.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-3">
      <div className="flex items-start gap-3">
        {flow && <QrSvg value={flow.verification_uri} size={88} />}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            {strings.github.openAndApprove}
          </p>
          <Link
            href={flow?.verification_uri ?? "https://github.com/login/device"}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-accent underline"
          >
            github.com/login/device
          </Link>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.2em] text-foreground sm:text-3xl">
            {flow?.user_code}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted">
            <Loader2
              size={12}
              className="animate-spin"
              style={{ color: "var(--accent)" }}
              strokeWidth={2}
            />
            {strings.github.waiting} · {Math.floor(remaining / 60)}:
            {String(remaining % 60).padStart(2, "0")}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RepoSelectSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { settings, update } = useSettings();
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotionPref();
  const { data, error, isLoading } = useSWR<{
    repos: {
      full_name: string;
      private: boolean;
      language: string | null;
      stars: number;
    }[];
  }>(open ? "/api/github/repos" : null, fetcher);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const focusT = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(focusT);
    };
  }, [open, onClose]);

  const filtered =
    data?.repos.filter((r) =>
      r.full_name.toLowerCase().includes(q.toLowerCase()),
    ) ?? [];

  const toggle = (full: string) => {
    const set = new Set(settings.selectedRepos);
    if (set.has(full)) set.delete(full);
    else set.add(full);
    update({ selectedRepos: [...set] });
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <m.div
          key="repo-scrim"
          className="fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-[var(--scrim)] p-4"
          role="presentation"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
          transition={snappy}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <m.div
            className="glass-elevated flex max-h-[min(90dvh,32rem)] w-full max-w-md flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={
              reducedMotion ? false : { opacity: 0, y: 28, scale: 0.94 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reducedMotion
                ? undefined
                : { opacity: 0, y: 16, scale: 0.96 }
            }
            transition={soft}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[color-mix(in_oklab,#ffffff_8%,transparent)] px-4 py-3">
              <h2
                id={titleId}
                className="text-sm font-semibold tracking-tight text-foreground"
              >
                {strings.github.chooseRepos}
              </h2>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border-none bg-transparent px-2 py-1 text-xs font-medium leading-tight text-muted shadow-none transition-[transform,background,color] duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:bg-[color-mix(in_oklab,#ffffff_8%,transparent)] hover:text-foreground active:scale-[0.97]"
                onClick={onClose}
              >
                {strings.github.done}
              </button>
            </div>
            <div className="shrink-0 px-4 pt-3">
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={strings.github.search}
                className="w-full rounded-[var(--radius-md)] border-none bg-[color-mix(in_oklab,#000000_40%,transparent)] px-3 py-[0.55rem] text-[length:var(--text-body)] text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.35),inset_0_0_0_1px_var(--glass-border)] outline-none transition-[box-shadow,background] duration-[var(--duration-fast)] ease-[var(--ease-out)] placeholder:text-muted-strong focus:bg-[color-mix(in_oklab,#000000_28%,transparent)] focus:shadow-[inset_0_1px_2px_rgb(0_0_0/0.3),inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_45%,transparent),0_0_0_3px_color-mix(in_oklab,var(--accent)_22%,transparent)]"
                aria-label={strings.github.searchAria}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
              {isLoading && (
                <p className="p-2 text-sm text-muted">{strings.github.loading}</p>
              )}
              {error && (
                <p className="p-2 text-sm text-danger">
                  {(error as Error).message}
                </p>
              )}
              {filtered.map((r) => {
                const on = settings.selectedRepos.includes(r.full_name);
                return (
                  <button
                    key={r.full_name}
                    type="button"
                    onClick={() => toggle(r.full_name)}
                    data-active={on}
                    className="mb-1 flex w-full cursor-pointer items-center justify-between rounded-[var(--radius-md)] border-none bg-transparent px-[0.6rem] py-2 text-start text-[length:var(--text-body)] text-foreground/88 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[color-mix(in_oklab,#ffffff_6%,transparent)] data-[active=true]:bg-[color-mix(in_oklab,#ffffff_11%,transparent)] data-[active=true]:text-foreground data-[active=true]:shadow-[inset_0_0_0_1px_var(--glass-border)]"
                  >
                    <span className="truncate">{r.full_name}</span>
                    <span className="ms-2 shrink-0 text-[10px] text-muted">
                      {r.private
                        ? strings.github.private
                        : strings.github.public}{" "}
                      · ★{r.stars}
                    </span>
                  </button>
                );
              })}
            </div>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function GitHubCard({ onOpenRepos }: { onOpenRepos: () => void }) {
  const { settings } = useSettings();
  const {
    data: me,
    error: meError,
    mutate: mutateMe,
    isLoading: meLoading,
  } = useSWR<Me>("/api/github/me", fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("github") === "connected") {
      void mutateMe();
      window.history.replaceState({}, "", "/");
    }
  }, [mutateMe]);

  const unauthorized =
    Boolean(meError) && (meError as { status?: number }).status === 401;

  const reposKey =
    me && !unauthorized && settings.selectedRepos.length > 0
      ? `/api/github/repo-status?repos=${encodeURIComponent(settings.selectedRepos.join(","))}`
      : null;
  const commitsKey =
    me && !unauthorized && settings.selectedRepos.length > 0
      ? `/api/github/commits?repos=${encodeURIComponent(settings.selectedRepos.join(","))}&limit=20`
      : null;

  const { data: statusData, isLoading: statusLoading } = useSWR<{
    repos: RepoStatus[];
  }>(reposKey, fetcher, { refreshInterval: 60_000 });

  const { data: commitsData, isLoading: commitsLoading } = useSWR<{
    commits: Commit[];
  }>(commitsKey, fetcher, { refreshInterval: 60_000 });

  const [seen, setSeen] = useState<Set<string>>(new Set());
  useEffect(() => {
    const shas = commitsData?.commits.map((c) => c.sha) ?? [];
    if (shas.length === 0) return;
    const t = window.setTimeout(() => {
      setSeen(new Set(shas));
    }, 2500);
    return () => clearTimeout(t);
  }, [commitsData]);

  if (meLoading) {
    return (
      <section className="card flex h-full items-center justify-center p-4">
        <div className="h-20 w-full animate-shimmer rounded-[var(--radius-md)] bg-[linear-gradient(90deg,color-mix(in_oklab,#ffffff_5%,transparent)_0%,color-mix(in_oklab,#ffffff_10%,transparent)_50%,color-mix(in_oklab,#ffffff_5%,transparent)_100%)] bg-size-[200%_100%] shadow-[inset_0_0_0_1px_var(--glass-border)] motion-reduce:animate-none" />
      </section>
    );
  }

  if (!me || unauthorized) {
    return (
      <section className="card h-full overflow-hidden">
        <ConnectFlow onConnected={() => void mutateMe()} />
      </section>
    );
  }

  return (
    <section className="card flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-[0.55rem] border-b border-[color-mix(in_oklab,#ffffff_8%,transparent)] px-[0.85rem] py-[0.55rem]">
        <Link
          href={`https://github.com/${me.login}`}
          target="_blank"
          rel="noreferrer"
          className="group flex min-w-0 flex-1 items-center gap-[0.55rem] rounded-[var(--radius-sm)] no-underline outline-none transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-out)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          title={`@${me.login} on GitHub`}
        >
          <Image
            src={me.avatar_url}
            alt=""
            className="size-[1.4rem] shrink-0 rounded-full object-cover shadow-[0_0_0_1px_color-mix(in_oklab,#ffffff_16%,transparent),0_0_0_3px_color-mix(in_oklab,#ffffff_4%,transparent)] transition-[box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)] group-hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--accent)_45%,transparent),0_0_0_3px_color-mix(in_oklab,var(--accent)_12%,transparent)]"
            width={24}
            height={24}
          />
          <span className="min-w-0 truncate text-[0.8125rem] font-semibold tracking-[var(--tracking-tight)] text-foreground underline-offset-[0.18em] transition-[color,text-decoration-color] duration-[var(--duration-fast)] ease-[var(--ease-out)] group-hover:text-accent group-hover:underline group-hover:decoration-[color-mix(in_oklab,var(--accent)_50%,transparent)]">
            {me.login}
          </span>
        </Link>
        <button
          type="button"
          onClick={onOpenRepos}
          className="ms-auto inline-flex cursor-pointer items-center gap-[0.35rem] rounded-full border-none bg-transparent px-[0.45rem] py-[0.2rem] text-[0.625rem] font-[550] uppercase tracking-[0.04em] text-muted transition-[transform,background,color] duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:bg-[color-mix(in_oklab,#ffffff_8%,transparent)] hover:text-foreground active:scale-[0.97]"
        >
          {strings.github.repos}
          <span className="inline-flex min-w-[1.1rem] items-center justify-center rounded-[var(--radius-sm)] bg-[color-mix(in_oklab,#ffffff_8%,transparent)] px-[0.3rem] py-[0.05rem] text-[0.625rem] font-[650] normal-case tracking-normal text-foreground/78 tabular-nums shadow-[inset_0_0_0_1px_color-mix(in_oklab,#ffffff_8%,transparent)]">
            {settings.selectedRepos.length}
          </span>
        </button>
      </header>

      {settings.selectedRepos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4">
          <p className="text-sm text-muted">{strings.github.noRepos}</p>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border-none bg-[color-mix(in_oklab,var(--accent)_88%,white)] px-[1.05rem] py-2 text-[length:var(--text-body)] font-semibold leading-tight tracking-[-0.01em] text-accent-fg shadow-[inset_0_1px_0_0_color-mix(in_oklab,#ffffff_40%,transparent),inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_35%,transparent),0_6px_18px_-8px_color-mix(in_oklab,var(--accent)_35%,transparent)] transition-[transform,filter,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:scale-[1.02] hover:brightness-[1.08] active:scale-[0.97]"
            onClick={onOpenRepos}
          >
            {strings.github.chooseReposCta}
          </button>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-rows-2">
          <div className="min-h-0 overflow-auto border-b border-[color-mix(in_oklab,#ffffff_8%,transparent)] px-[0.4rem] py-[0.35rem]">
            {statusLoading && !statusData && (
              <div className="m-1 h-12 animate-shimmer rounded-[var(--radius-md)] bg-[linear-gradient(90deg,color-mix(in_oklab,#ffffff_5%,transparent)_0%,color-mix(in_oklab,#ffffff_10%,transparent)_50%,color-mix(in_oklab,#ffffff_5%,transparent)_100%)] bg-size-[200%_100%] shadow-[inset_0_0_0_1px_var(--glass-border)] motion-reduce:animate-none" />
            )}
            {statusData?.repos.map((r) => {
              const name = r.full_name.split("/")[1] ?? r.full_name;
              const hasStars = r.stars > 0;
              const hasIssues = r.open_issues > 0;
              const ci = ciColor(r.ci_status, r.ci_conclusion);
              return (
                <div
                  key={r.full_name}
                  className="flex items-center gap-[0.6rem] rounded-[var(--radius-sm)] px-[0.55rem] py-2 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[color-mix(in_oklab,#ffffff_4.5%,transparent)] shadow-[inset_0_1px_0_0_color-mix(in_oklab,#ffffff_5%,transparent)] first:shadow-none"
                >
                  <span
                    className="size-[0.42rem] shrink-0 rounded-full"
                    style={
                      {
                        "--gh-ci": ci,
                        background: ci,
                        boxShadow:
                          "0 0 0 1px color-mix(in oklab, var(--gh-ci, #71717a) 35%, transparent), 0 0 8px color-mix(in oklab, var(--gh-ci, transparent) 45%, transparent)",
                      } as CSSProperties
                    }
                    title={
                      r.ci_conclusion ?? r.ci_status ?? strings.github.noCi
                    }
                  />
                  <Link
                    href={`https://github.com/${r.full_name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-[0.8125rem] font-[550] tracking-[var(--tracking-tight)] text-foreground/92 no-underline underline-offset-[0.2em] transition-[color,text-decoration-color] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-accent hover:underline hover:decoration-[color-mix(in_oklab,var(--accent)_50%,transparent)] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                    title={r.full_name}
                  >
                    {name}
                  </Link>
                  <div
                    className="flex shrink-0 items-center gap-[0.4rem] font-mono"
                    aria-label="Repository stats"
                  >
                    <span
                      className="inline-flex items-center gap-[0.22rem] leading-none tabular-nums data-[tone=star]:text-[#e8c468] data-[tone=issue]:text-danger data-[tone=idle]:text-muted/68"
                      data-tone={hasStars ? "star" : "idle"}
                      title={`${r.stars} stars`}
                    >
                      <Star
                        size={11}
                        strokeWidth={hasStars ? 0 : 1.75}
                        fill={hasStars ? "currentColor" : "none"}
                        aria-hidden
                      />
                      <span className="text-[0.6875rem] font-[550] tracking-[-0.01em]">
                        {r.stars}
                      </span>
                    </span>
                    <span
                      className="h-[0.7rem] w-px bg-[color-mix(in_oklab,#ffffff_10%,transparent)]"
                      aria-hidden
                    />
                    <span
                      className="inline-flex items-center gap-[0.22rem] leading-none tabular-nums data-[tone=star]:text-[#e8c468] data-[tone=issue]:text-danger data-[tone=idle]:text-muted/68"
                      data-tone={hasIssues ? "issue" : "idle"}
                      title={`${r.open_issues} open issues`}
                    >
                      <CircleAlert size={11} strokeWidth={1.75} aria-hidden />
                      <span className="text-[0.6875rem] font-[550] tracking-[-0.01em]">
                        {r.open_issues}
                      </span>
                    </span>
                    <span
                      className="h-[0.7rem] w-px bg-[color-mix(in_oklab,#ffffff_10%,transparent)]"
                      aria-hidden
                    />
                    <span className="min-w-[1.85rem] text-end text-[0.625rem] font-medium tracking-[0.01em] text-muted/62 tabular-nums">
                      {r.pushed_at ? relativeTime(r.pushed_at) : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="min-h-0 overflow-auto px-2 py-1">
            {commitsLoading && !commitsData && (
              <div className="m-1 h-12 animate-shimmer rounded-[var(--radius-md)] bg-[linear-gradient(90deg,color-mix(in_oklab,#ffffff_5%,transparent)_0%,color-mix(in_oklab,#ffffff_10%,transparent)_50%,color-mix(in_oklab,#ffffff_5%,transparent)_100%)] bg-size-[200%_100%] shadow-[inset_0_0_0_1px_var(--glass-border)] motion-reduce:animate-none" />
            )}
            {!commitsLoading && commitsData?.commits.length === 0 && (
              <p className="p-2 text-xs text-muted">{strings.github.noCommits}</p>
            )}
            {commitsData?.commits.map((c) => {
              const isNew = seen.size > 0 && !seen.has(c.sha);
              return (
                <div
                  key={`${c.repo}-${c.sha}`}
                  className={`border-s-2 py-1.5 ps-2 transition-colors ${
                    isNew
                      ? "border-accent bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]"
                      : "border-transparent"
                  }`}
                >
                  <p className="truncate text-xs text-foreground/90">{c.message}</p>
                  <p className="text-[10px] text-muted">
                    {c.repo.split("/")[1]} ·{" "}
                    <span className="font-mono">{c.sha}</span> ·{" "}
                    {relativeTime(c.date)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
