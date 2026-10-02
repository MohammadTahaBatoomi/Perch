import "server-only";

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public rateLimited = false,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export type GitHubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
};

export type GitHubRepo = {
  name: string;
  full_name: string;
  private: boolean;
  stargazers_count: number;
  open_issues_count: number;
  pushed_at: string | null;
  language: string | null;
  default_branch: string;
};

export type GitHubCommit = {
  sha: string;
  message: string;
  repo: string;
  date: string;
  html_url: string;
};

export type CiConclusion =
  | "success"
  | "failure"
  | "cancelled"
  | "skipped"
  | "timed_out"
  | "action_required"
  | "neutral"
  | "stale"
  | null;

export type RepoStatus = {
  full_name: string;
  stars: number;
  open_issues: number;
  default_branch: string;
  pushed_at: string | null;
  ci_status: string | null;
  ci_conclusion: CiConclusion;
};

type CacheEntry = {
  etag: string;
  body: unknown;
  at: number;
};

const etagCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getClientId(): string {
  const id = process.env.GITHUB_CLIENT_ID;
  if (!id) throw new Error("GITHUB_CLIENT_ID is not set");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.GITHUB_CLIENT_SECRET;
  if (!secret) {
    throw new Error(
      "GITHUB_CLIENT_SECRET is not set (required for web OAuth authorize flow)",
    );
  }
  return secret;
}

export function getOAuthScopes(): string {
  return process.env.GITHUB_OAUTH_SCOPES ?? "read:user public_repo";
}

/** Build GitHub authorize URL for the classic “Authorize” page flow. */
export function buildAuthorizeUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: redirectUri,
    scope: getOAuthScopes(),
    state,
    allow_signup: "false",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/** Exchange authorization code for access token (server-side only). */
export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string,
): Promise<string> {
  const data = await postForm("https://github.com/login/oauth/access_token", {
    client_id: getClientId(),
    client_secret: getClientSecret(),
    code,
    redirect_uri: redirectUri,
  });

  if (typeof data.access_token === "string") {
    return data.access_token;
  }

  throw new GitHubApiError(
    typeof data.error_description === "string"
      ? data.error_description
      : typeof data.error === "string"
        ? data.error
        : "Failed to exchange code",
    400,
  );
}

type FormBody = Record<string, string>;

async function postForm(
  url: string,
  body: FormBody,
): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
    cache: "no-store",
  });
  const data = (await res.json()) as Record<string, unknown>;
  return data;
}

export async function startDeviceFlow(): Promise<{
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}> {
  const data = await postForm("https://github.com/login/device/code", {
    client_id: getClientId(),
    scope: getOAuthScopes(),
  });

  if (typeof data.error === "string") {
    throw new GitHubApiError(
      typeof data.error_description === "string"
        ? data.error_description
        : data.error,
      400,
    );
  }

  return {
    device_code: String(data.device_code),
    user_code: String(data.user_code),
    verification_uri: String(
      data.verification_uri ?? "https://github.com/login/device",
    ),
    expires_in: Number(data.expires_in ?? 900),
    interval: Number(data.interval ?? 5),
  };
}

export type PollResult =
  | { status: "pending" }
  | { status: "slow_down"; interval_bump: number }
  | { status: "expired" }
  | { status: "denied" }
  | { status: "error"; message: string }
  | { status: "success"; access_token: string };

export async function pollDeviceFlow(deviceCode: string): Promise<PollResult> {
  const data = await postForm("https://github.com/login/oauth/access_token", {
    client_id: getClientId(),
    device_code: deviceCode,
    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
  });

  if (typeof data.access_token === "string") {
    return { status: "success", access_token: data.access_token };
  }

  const error = typeof data.error === "string" ? data.error : "unknown";
  switch (error) {
    case "authorization_pending":
      return { status: "pending" };
    case "slow_down":
      return { status: "slow_down", interval_bump: 5 };
    case "expired_token":
      return { status: "expired" };
    case "access_denied":
      return { status: "denied" };
    default:
      return {
        status: "error",
        message:
          typeof data.error_description === "string"
            ? data.error_description
            : error,
      };
  }
}

async function ghFetch<T>(
  token: string,
  path: string,
  init?: RequestInit & { revalidate?: number },
): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `https://api.github.com${path}`;
  const cacheKey = `${token.slice(0, 8)}:${url}`;
  const cached = etagCache.get(cacheKey);

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Perch-Desk-Companion",
  };

  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    headers["If-None-Match"] = cached.etag;
  }

  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
    cache: "no-store",
  });

  if (res.status === 304 && cached) {
    return cached.body as T;
  }

  if (res.status === 401) {
    throw new GitHubApiError("Unauthorized", 401);
  }
  if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
    throw new GitHubApiError("Rate limited", 403, true);
  }
  if (!res.ok) {
    throw new GitHubApiError(`GitHub API ${res.status}`, res.status);
  }

  const body = (await res.json()) as T;
  const etag = res.headers.get("etag");
  if (etag) {
    etagCache.set(cacheKey, { etag, body, at: Date.now() });
  }
  return body;
}

export async function getMe(token: string): Promise<GitHubUser> {
  return ghFetch<GitHubUser>(token, "/user");
}

export async function listRepos(token: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  while (page <= 5) {
    const batch = await ghFetch<GitHubRepo[]>(
      token,
      `/user/repos?per_page=100&sort=pushed&page=${page}`,
    );
    repos.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return repos.sort((a, b) => {
    const at = a.pushed_at ? Date.parse(a.pushed_at) : 0;
    const bt = b.pushed_at ? Date.parse(b.pushed_at) : 0;
    return bt - at;
  });
}

type ActionsRun = {
  status: string | null;
  conclusion: CiConclusion;
};

type RepoDetail = {
  full_name: string;
  stargazers_count: number;
  open_issues_count: number;
  default_branch: string;
  pushed_at: string | null;
};

export async function getRepoStatuses(
  token: string,
  repos: string[],
): Promise<RepoStatus[]> {
  const results = await Promise.all(
    repos.map(async (full) => {
      const [owner, name] = full.split("/");
      if (!owner || !name) {
        throw new GitHubApiError(`Invalid repo: ${full}`, 400);
      }
      const [repo, runs] = await Promise.all([
        ghFetch<RepoDetail>(token, `/repos/${owner}/${name}`),
        ghFetch<{ workflow_runs: ActionsRun[] }>(
          token,
          `/repos/${owner}/${name}/actions/runs?per_page=1`,
        ).catch(() => ({ workflow_runs: [] as ActionsRun[] })),
      ]);
      const latest = runs.workflow_runs[0];
      return {
        full_name: repo.full_name,
        stars: repo.stargazers_count,
        open_issues: repo.open_issues_count,
        default_branch: repo.default_branch,
        pushed_at: repo.pushed_at,
        ci_status: latest?.status ?? null,
        ci_conclusion: latest?.conclusion ?? null,
      } satisfies RepoStatus;
    }),
  );
  return results;
}

type CommitApiItem = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { date: string } | null;
    committer: { date: string } | null;
  };
  author: { login: string } | null;
};

function mapCommit(full: string, c: CommitApiItem): GitHubCommit {
  return {
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0] ?? "",
    repo: full,
    date:
      c.commit.author?.date ??
      c.commit.committer?.date ??
      new Date().toISOString(),
    html_url: c.html_url,
  };
}

export async function getRecentCommits(
  token: string,
  repos: string[],
  login: string,
  limit: number,
): Promise<GitHubCommit[]> {
  const perRepo = Math.max(5, Math.ceil(limit / Math.max(repos.length, 1)));
  const batches = await Promise.all(
    repos.map(async (full) => {
      const [owner, name] = full.split("/");
      if (!owner || !name) return [] as GitHubCommit[];
      try {
        const items = await ghFetch<CommitApiItem[]>(
          token,
          `/repos/${owner}/${name}/commits?author=${encodeURIComponent(login)}&per_page=${perRepo}`,
        );
        return items.map((c) => mapCommit(full, c));
      } catch {
        return [] as GitHubCommit[];
      }
    }),
  );

  return batches
    .flat()
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, limit);
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type GhEvent = {
  type: string;
  created_at: string;
  repo: { name: string };
  payload: {
    size?: number;
    commits?: { sha: string; message: string; url?: string }[];
    ref_type?: string;
    action?: string;
  };
};

export type ActivityItem = {
  id: string;
  date: string;
  repo: string;
  message: string;
  html_url: string | null;
};

async function listUserEvents(
  token: string,
  login: string,
): Promise<GhEvent[]> {
  const out: GhEvent[] = [];
  for (let page = 1; page <= 3; page++) {
    const batch = await ghFetch<GhEvent[]>(
      token,
      `/users/${encodeURIComponent(login)}/events?per_page=100&page=${page}`,
    );
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

function emptyHeatmapWindow(): {
  days: { date: string; count: number }[];
  start: Date;
  today: Date;
} {
  const weeks = 12;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - start.getDay());

  const days: { date: string; count: number }[] = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    days.push({ date: localDateKey(d), count: 0 });
  }
  return { days, start, today };
}

async function heatmapFromRepoCommits(
  token: string,
  repos: string[],
  login: string,
  start: Date,
  today: Date,
): Promise<{
  days: { date: string; count: number }[];
  recent: ActivityItem[];
}> {
  const counts = new Map<string, number>();
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    counts.set(localDateKey(d), 0);
  }

  const since = start.toISOString();
  const recent: ActivityItem[] = [];
  const batches = await Promise.all(
    repos.map(async (full) => {
      const [owner, name] = full.split("/");
      if (!owner || !name) return [] as GitHubCommit[];
      try {
        const items = await ghFetch<CommitApiItem[]>(
          token,
          `/repos/${owner}/${name}/commits?author=${encodeURIComponent(login)}&since=${encodeURIComponent(since)}&per_page=100`,
        );
        return items.map((c) => mapCommit(full, c));
      } catch {
        return [] as GitHubCommit[];
      }
    }),
  );

  for (const c of batches.flat()) {
    const key = localDateKey(new Date(c.date));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    recent.push({
      id: `${c.sha}-${c.repo}`,
      date: c.date,
      repo: c.repo,
      message: c.message,
      html_url: c.html_url,
    });
  }

  recent.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return {
    days: [...counts.entries()].map(([date, count]) => ({ date, count })),
    recent: recent.slice(0, 30),
  };
}

/**
 * 12-week activity from the authenticated user's events feed
 * (PushEvent commit counts), with commit-API fallback.
 */
export async function getActivityHeatmap(
  token: string,
  repoFilter: string[] = [],
): Promise<{
  days: { date: string; count: number }[];
  recent: ActivityItem[];
}> {
  const me = await getMe(token);
  const { days: emptyDays, start, today } = emptyHeatmapWindow();
  const startMs = start.getTime();

  const filter =
    repoFilter.length > 0
      ? new Set(repoFilter.map((r) => r.toLowerCase()))
      : null;

  let events: GhEvent[] = [];
  try {
    events = await listUserEvents(token, me.login);
  } catch {
    // Events endpoint can fail for some tokens; fall back below.
    events = [];
  }

  if (events.length === 0) {
    let repos = repoFilter;
    if (repos.length === 0) {
      const all = await listRepos(token);
      repos = all.slice(0, 12).map((r) => r.full_name);
    }
    if (repos.length === 0) {
      return { days: emptyDays, recent: [] };
    }
    return heatmapFromRepoCommits(token, repos, me.login, start, today);
  }

  const counts = new Map<string, number>();
  for (const d of emptyDays) counts.set(d.date, 0);

  const recent: ActivityItem[] = [];

  for (const ev of events) {
    const created = new Date(ev.created_at);
    if (created.getTime() < startMs) continue;
    const repo = ev.repo?.name;
    if (!repo) continue;
    if (filter && !filter.has(repo.toLowerCase())) continue;

    const day = localDateKey(created);

    if (ev.type === "PushEvent") {
      const n = ev.payload.commits?.length ?? ev.payload.size ?? 1;
      if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + n);
      const commits = ev.payload.commits ?? [];
      for (const c of commits.slice(0, 3)) {
        recent.push({
          id: `${ev.created_at}-${c.sha}`,
          date: ev.created_at,
          repo,
          message: c.message.split("\n")[0] ?? "push",
          html_url: c.url
            ? c.url
                .replace("api.github.com/repos", "github.com")
                .replace("/commits/", "/commit/")
            : `https://github.com/${repo}`,
        });
      }
      if (commits.length === 0) {
        recent.push({
          id: `${ev.created_at}-${repo}-push`,
          date: ev.created_at,
          repo,
          message: `Pushed ${n} commit${n === 1 ? "" : "s"}`,
          html_url: `https://github.com/${repo}`,
        });
      }
    } else if (
      ev.type === "PullRequestEvent" ||
      ev.type === "IssuesEvent" ||
      ev.type === "CreateEvent" ||
      ev.type === "ReleaseEvent"
    ) {
      if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
      recent.push({
        id: `${ev.created_at}-${ev.type}-${repo}`,
        date: ev.created_at,
        repo,
        message: ev.type.replace(/Event$/, ""),
        html_url: `https://github.com/${repo}`,
      });
    }
  }

  recent.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  return {
    days: [...counts.entries()].map(([date, count]) => ({ date, count })),
    recent: recent.slice(0, 30),
  };
}

export async function revokeGrant(token: string): Promise<void> {
  try {
    await fetch(
      `https://api.github.com/applications/${getClientId()}/grant`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
  } catch {
    // Revocation without client secret may fail; cookie clear is enough for MVP.
  }
}
