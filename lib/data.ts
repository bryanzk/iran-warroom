import { getDashboardRefreshService } from "@/lib/dashboard-refresh";
import type { SeedData } from "@/lib/types";

export function getSeedData(): SeedData {
  return getDashboardRefreshService().getSnapshot();
}

export function startSeedAutoRefresh(): void {
  getDashboardRefreshService().start();
}

export async function refreshSeedSnapshot(): Promise<void> {
  const service = getDashboardRefreshService();
  service.start();
  await service.refreshOnce();
}
