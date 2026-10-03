"use client";

import useSWR from "swr";
import Link from "next/link";
import { relativeTime } from "@/lib/format";
import { strings } from "@/lib/strings";

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
  totalContributions?: number;
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

function useActivity() {
  return useSWR("/api/github/activity", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 5 * 60 * 1000,
  });
}

function levelIndex(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function levelColor(count: number): string {
  return `var(--contrib-${levelIndex(count)})`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""] as const;

const CELL = 10;
const GAP = 3;
const DAY_LABEL_W = 28;
const MONTH_LABEL_H = 16;

function monthLabels(weeks: Day[][]): { label: string; x: number }[] {
  const out: { label: string; x: number }[] = [];
  let lastMonth = -1;
  let lastX = -Infinity;
  const minGap = CELL * 2.4;
  weeks.forEach((week, wi) => {
    const first = week[0];
    if (!first || first.count < 0) return;
    const month = Number(first.date.slice(5, 7)) - 1;
    if (month === lastMonth) return;
    const x = DAY_LABEL_W + wi * (CELL + GAP);
    if (x - lastX < minGap) return;
    lastMonth = month;
    lastX = x;
    out.push({ label: MONTHS[month] ?? "", x });
  });
  return out;
}

function ActivityStatus({
  error,
  isLoading,
  empty,
}: {
  error?: Error;
  isLoading: boolean;
  empty?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="card h-full w-full animate-shimmer bg-[linear-gradient(90deg,color-mix(in_oklab,#ffffff_5%,transparent)_0%,color-mix(in_oklab,#ffffff_10%,transparent)_50%,color-mix(in_oklab,#ffffff_5%,transparent)_100%)] bg-size-[200%_100%] motion-reduce:animate-none" />
    );
  }

  if (error) {
    const unauthorized =
      "status" in error && (error as Error & { status?: number }).status === 401;
    return (
      <div className="card flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted">
          {unauthorized
            ? strings.activity.connectFirst
            : error.message || strings.activity.couldNotLoad}
        </p>
        {unauthorized && (
          <Link
            href="/"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border-none bg-[color-mix(in_oklab,var(--accent)_88%,white)] px-[1.05rem] py-2 text-xs font-semibold leading-tight tracking-[-0.01em] text-accent-fg no-underline shadow-[inset_0_1px_0_0_color-mix(in_oklab,#ffffff_40%,transparent),inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_35%,transparent),0_6px_18px_-8px_color-mix(in_oklab,var(--accent)_35%,transparent)] transition-[transform,filter,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:scale-[1.02] hover:brightness-[1.08] active:scale-[0.97]"
          >
            {strings.activity.goHome}
          </Link>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="card flex h-full items-center justify-center p-6 text-sm text-muted">
        {strings.activity.noData}
      </div>
    );
  }

  return null;
}

export function ActivityHeatmap() {
  const { data, error, isLoading } = useActivity();
  const status = (
    <ActivityStatus
      error={error}
      isLoading={isLoading}
      empty={!data}
    />
  );
  if (isLoading || error || !data) return status;

  const weeks: Day[][] = [];
  for (let i = 0; i < data.days.length; i += 7) {
    const slice = data.days.slice(i, i + 7);
    while (slice.length < 7) {
      slice.push({ date: `pad-${slice.length}`, count: -1 });
    }
    weeks.push(slice);
  }

  const gridW = weeks.length * (CELL + GAP) - GAP;
  const gridH = 7 * (CELL + GAP) - GAP;
  const width = DAY_LABEL_W + gridW;
  const height = MONTH_LABEL_H + gridH;
  const total =
    data.totalContributions ??
    data.days.reduce((n, d) => n + d.count, 0);
  const months = monthLabels(weeks);

  return (
    <section className="card flex h-full min-h-0 flex-col justify-start gap-[0.45rem] overflow-hidden p-2.5 sm:p-3 md:p-5 lg:p-6 min-[700px]:justify-center min-[700px]:gap-4">
      <header className="shrink-0 px-[0.1rem] min-[700px]:px-[0.35rem]">
        <h1 className="m-0 text-[clamp(0.78rem,2.2vw+0.4rem,1rem)] font-semibold leading-snug tracking-[-0.02em] text-foreground min-[700px]:text-[clamp(0.9rem,1.4cqi+0.5rem,1.2rem)] min-[700px]:leading-tight">
          {total.toLocaleString("en-US")} contributions in the last year
        </h1>
      </header>

      <div className="min-h-0 w-full flex-[0_1_auto] overflow-x-auto overflow-y-hidden overscroll-x-contain [-webkit-overflow-scrolling:touch] min-[700px]:overflow-visible min-[700px]:px-1 min-[700px]:py-[0.35rem]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="activity-heatmap"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={strings.activity.heatmapAria}
        >
          {months.map((m) => (
            <text
              key={`${m.label}-${m.x}`}
              x={m.x}
              y={11}
              className="activity-heatmap__label"
            >
              {m.label}
            </text>
          ))}

          {DAY_LABELS.map((label, di) =>
            label ? (
              <text
                key={`day-${di}`}
                x={0}
                y={MONTH_LABEL_H + di * (CELL + GAP) + CELL - 1}
                className="activity-heatmap__label"
              >
                {label}
              </text>
            ) : null,
          )}

          {weeks.map((week, wi) =>
            week.map((day, di) => {
              if (day.count < 0) return null;
              return (
                <rect
                  key={day.date}
                  x={DAY_LABEL_W + wi * (CELL + GAP)}
                  y={MONTH_LABEL_H + di * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  ry={2}
                  fill={levelColor(day.count)}
                  className="activity-heatmap__cell"
                >
                  <title>
                    {day.count} contribution{day.count === 1 ? "" : "s"} on{" "}
                    {day.date}
                  </title>
                </rect>
              );
            }),
          )}
        </svg>
      </div>

      <footer className="mt-auto hidden shrink-0 flex-nowrap items-center justify-end gap-[0.3rem] whitespace-nowrap px-[0.1rem] min-[700px]:mt-0 min-[700px]:flex min-[700px]:gap-[0.35rem] min-[700px]:px-[0.35rem] min-[700px]:pt-[0.15rem] max-[520px]:!hidden">
        <span className="text-[10px] leading-none text-foreground/55 min-[700px]:text-[11px]">
          {strings.activity.less}
        </span>
        <span className="inline-flex shrink-0 items-center gap-[3px]">
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="inline-block size-2.5 rounded-sm shadow-[inset_0_0_0_1px_color-mix(in_oklab,#ffffff_8%,transparent)] min-[700px]:size-[11px]"
              style={{ background: `var(--contrib-${level})` }}
            />
          ))}
        </span>
        <span className="text-[10px] leading-none text-foreground/55 min-[700px]:text-[11px]">
          {strings.activity.more}
        </span>
      </footer>
    </section>
  );
}

export function ActivityRecent() {
  const { data, error, isLoading } = useActivity();
  const status = (
    <ActivityStatus error={error} isLoading={isLoading} empty={!data} />
  );
  if (isLoading || error || !data) return status;

  return (
    <section className="card flex h-full min-h-0 flex-col overflow-hidden p-3">
      <h2 className="m-0 shrink-0 text-[0.8rem] font-semibold tracking-[-0.01em] text-foreground/88">
        {strings.activity.recent}
      </h2>
      {data.recent.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{strings.activity.noEvents}</p>
      ) : (
        <ul className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain">
          {data.recent.map((item) => {
            const body = (
              <>
                <div className="truncate text-sm text-foreground/90">
                  {item.message}
                </div>
                <div className="mt-0.5 flex gap-2 text-[11px] text-muted">
                  <span className="truncate">{item.repo}</span>
                  <span className="shrink-0">{relativeTime(item.date)}</span>
                </div>
              </>
            );
            return (
              <li
                key={item.id}
                className="rounded-[var(--radius-sm)] px-1.5 py-1.5 hover:bg-[color-mix(in_oklab,#ffffff_6%,transparent)]"
              >
                {item.html_url ? (
                  <Link
                    href={item.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="block">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
