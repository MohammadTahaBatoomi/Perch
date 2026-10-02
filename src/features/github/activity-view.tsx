"use client";

import useSWR from "swr";
import Link from "next/link";
import { relativeTime } from "@/lib/format";
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
  if (count === 0) return "#27272a";
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
        <p className="text-sm text-zinc-400">
          {unauthorized
            ? "Connect GitHub first to see activity."
            : error.message || "Could not load activity"}
        </p>
        {unauthorized && (
          <Link href="/" className="btn-accent text-xs">
            Go to Home
          </Link>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card flex h-full items-center justify-center p-6 text-sm text-zinc-500">
        No activity data yet.
      </div>
    );
  }

  const cell = 11;
  const gap = 3;
  const weeks: Day[][] = [];
  for (let i = 0; i < data.days.length; i += 7) {
    weeks.push(data.days.slice(i, i + 7));
  }
  const width = Math.max(weeks.length * (cell + gap) - gap, cell);
  const height = 7 * (cell + gap) - gap;
  const total = data.days.reduce((n, d) => n + d.count, 0);

  return (
    <div className="activity-grid h-full gap-2">
      <section className="card flex min-h-0 flex-col gap-3 overflow-hidden p-3">
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div>
            <h1 className="text-sm font-medium text-zinc-100">Activity</h1>
            <p className="mt-0.5 text-[11px] text-zinc-500">{data.limitation}</p>
          </div>
          <p className="shrink-0 font-mono text-xs text-zinc-400">
            {total} · 12w
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-[120px] w-full sm:h-[140px]"
            preserveAspectRatio="xMinYMid meet"
            role="img"
            aria-label="12-week activity heatmap"
          >
            {weeks.map((week, wi) =>
              week.map((day, di) => (
                <rect
                  key={day.date}
                  x={wi * (cell + gap)}
                  y={di * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx={2}
                  fill={level(day.count)}
                  stroke="#3f3f46"
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
        <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-zinc-500">
          <span>Less</span>
          {[0, 1, 2, 3, 5].map((c) => (
            <span
              key={c}
              className="inline-block size-2.5 rounded-sm"
              style={{ background: level(c) }}
            />
          ))}
          <span>More</span>
        </div>
      </section>

      <section className="card flex min-h-0 flex-col overflow-hidden p-3">
        <h2 className="shrink-0 text-xs font-medium text-zinc-300">Recent</h2>
        {data.recent.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No recent GitHub events in the feed yet.
          </p>
        ) : (
          <ul className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
            {data.recent.map((item) => (
              <li key={item.id} className="rounded px-1 py-1 hover:bg-zinc-900">
                <a
                  href={item.html_url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <div className="truncate text-xs text-zinc-200">
                    {item.message}
                  </div>
                  <div className="mt-0.5 flex gap-2 text-[10px] text-zinc-500">
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
