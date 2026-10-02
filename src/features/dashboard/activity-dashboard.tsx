"use client";

import { AppShell } from "@/features/dashboard/app-shell";
import { ActivityView } from "@/features/github/activity-view";

export function ActivityDashboard() {
  return (
    <AppShell>
      <ActivityView />
    </AppShell>
  );
}
