import "server-only";

/**
 * Typed GitHub REST client: fetch + error mapping + ETag cache.
 * Used only from Route Handlers / server modules — never from the browser.
 */

export {
  GitHubApiError,
  getMe,
  listRepos,
  getRepoStatuses,
  getRecentCommits,
  getActivityHeatmap,
  startDeviceFlow,
  pollDeviceFlow,
  getOAuthScopes,
  revokeGrant,
  type GitHubUser,
  type GitHubRepo,
  type GitHubCommit,
  type RepoStatus,
  type PollResult,
  type CiConclusion,
} from "@/server/github";
