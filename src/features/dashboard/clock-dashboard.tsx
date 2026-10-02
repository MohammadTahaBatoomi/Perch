"use client";

import { AppShell } from "@/features/dashboard/app-shell";
import { ClockCard } from "@/features/clock/clock-card";

/**
 * Full-viewport clock for StandBy / fullscreen use.
 * No GitHub panel — just the clock.
 */
export function ClockDashboard() {
  return (
    <AppShell>
      <div className="clock-fullscreen">
        <ClockCard />
      </div>
    </AppShell>
  );
}
