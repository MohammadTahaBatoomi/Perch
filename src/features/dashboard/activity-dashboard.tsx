"use client";

import { AppShell, useShell } from "@/features/dashboard/app-shell";
import { ActivityView } from "@/features/github/activity-view";
import { GitHubCard } from "@/features/github/github-card";

function ActivityBody() {
  const { openRepos } = useShell();
  return (
    <div className="home-standby home-standby--activity">
      <div className="home-standby__hero home-standby__hero--fill min-h-0">
        <ActivityView />
      </div>
      <div className="home-standby__periphery min-h-0">
        <GitHubCard onOpenRepos={openRepos} />
      </div>
    </div>
  );
}

export function ActivityDashboard() {
  return (
    <AppShell>
      <ActivityBody />
    </AppShell>
  );
}
