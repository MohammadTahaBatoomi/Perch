"use client";

import useSWR from "swr";
import Link from "next/link";
import { relativeTime } from "@/lib/format";
import { strings } from "@/lib/strings";
import { useSettings } from "@/features/settings/settings-provider";

type Day = { date: string; count: number };
type RecentItem = {
  id: string;
  date: string;
  repo: string;
  message: string;
  html_url: string | null;
};

type ActivityResponse = {
  days: Day[];
  recent: RecentItem[];
  source?: string;
  limitation: string;
};

async function fetcher(url: string): Promise<ActivityResponse> {
  const res = await fetch(url);
  if (res.status === 401) {
    const err = new Error("Unauthorized") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<ActivityResponse>;
}

function level(count: number): string {
  if (count === 0) return "color-mix(in oklab, #ffffff 10%, transparent)";
  if (count === 1) return "color-mix(in oklab, var(--accent) 35%, #18181b)";
  if (count === 2) return "color-mix(in oklab, var(--accent) 55%, #18181b)";
  if (count <= 4) return "color-mix(in oklab, var(--accent) 75%, #18181b)";
  return "var(--accent)";
}

export function ActivityView() {
  const { settings } = useSettings();
  const reposQ =
    settings.selectedRepos.length > 0
      ? `?repos=${encodeURIComponent(settings.selectedRepos.join(","))}`
      : "";
  const key = `/api/github/activity${reposQ}`;

  const { data, error, isLoading } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <div className="card skeleton h-full w-full" />;
  }

  if (error) {
    const unauthorized =
      error instanceof Error &&
      "status" in error &&
      (error as Error & { status?: number }).status === 401;
    return (
      <div className="card flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted">
          {unauthorized
            ? strings.activity.connectFirst
            : error.message || strings.activity.couldNotLoad}
        </p>
        {unauthorized && (
          <Link href="/" className="btn-accent text-xs">
            {strings.activity.goHome}
          </Link>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card flex h-full items-center justify-center p-6 text-sm text-muted">
        {strings.activity.noData}
      </div>
    );
  }

  const cell = 14;
  const gap = 4;
  const weeks: Day[][] = [];
  for (let i = 0; i < data.days.length; i += 7) {
    weeks.push(data.days.slice(i, i + 7));
  }
  const width = Math.max(weeks.length * (cell + gap) - gap, cell);
  const height = 7 * (cell + gap) - gap;
  const total = data.days.reduce((n, d) => n + d.count, 0);

  return (
    <div className="activity-stack h-full">
      <section className="card flex min-h-0 flex-col gap-2.5 overflow-hidden p-3.5 sm:p-4">
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {strings.activity.title}
            </h1>
            <p className="mt-0.5 text-[11px] leading-snug text-muted sm:text-xs">
              {data.limitation}
            </p>
          </div>
          <p className="shrink-0 font-mono text-xs text-muted sm:text-sm">
            {total} · 12w
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="activity-heatmap"
            preserveAspectRatio="xMinYMid meet"
            role="img"
            aria-label={strings.activity.heatmapAria}
          >
            {weeks.map((week, wi) =>
              week.map((day, di) => (
                <rect
                  key={day.date}
                  x={wi * (cell + gap)}
                  y={di * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx={3}
                  fill={level(day.count)}
                  stroke="color-mix(in oklab, #ffffff 14%, transparent)"
                  strokeWidth={0.5}
                >
                  <title>
                    {day.date}: {day.count}
                  </title>
                </rect>
              )),
            )}
          </svg>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted sm:text-[11px]">
          <span>{strings.activity.less}</span>
          {[0, 1, 2, 3, 5].map((c) => (
            <span
              key={c}
              className="inline-block size-3 rounded-sm"
              style={{ background: level(c) }}
            />
          ))}
          <span>{strings.activity.more}</span>
        </div>
      </section>

      <section className="card flex min-h-0 flex-col overflow-hidden p-3.5 sm:p-4">
        <h2 className="shrink-0 text-sm font-semibold tracking-tight text-foreground/85">
          {strings.activity.recent}
        </h2>
        {data.recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{strings.activity.noEvents}</p>
        ) : (
          <ul className="mt-2.5 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain">
            {data.recent.map((item) => (
              <li
                key={item.id}
                className="rounded-[var(--radius-sm)] px-1.5 py-1.5 hover:bg-[color-mix(in_oklab,#ffffff_6%,transparent)]"
              >
                <a
                  href={item.html_url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <div className="truncate text-sm text-foreground/90">
                    {item.message}
                  </div>
                  <div className="mt-0.5 flex gap-2 text-[11px] text-muted">
                    <span className="truncate">{item.repo}</span>
                    <span className="shrink-0">{relativeTime(item.date)}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
