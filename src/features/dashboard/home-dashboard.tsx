"use client";

import { AppShell, useShell } from "@/features/dashboard/app-shell";
import { ClockCard } from "@/features/clock/clock-card";
import { GitHubCard } from "@/features/github/github-card";

function HomeBody() {
  const { openRepos } = useShell();
  return (
    <div className="home-standby">
      <div className="home-standby__hero min-h-0">
        <ClockCard />
      </div>
      <div className="home-standby__periphery min-h-0">
        <GitHubCard onOpenRepos={openRepos} />
      </div>
    </div>
  );
}

export function HomeDashboard() {
  return (
    <AppShell>
      <HomeBody />
    </AppShell>
  );
}
