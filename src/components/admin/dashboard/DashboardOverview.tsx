
import { SystemStatusCard } from "./SystemStatusCard";
import { RecentActivityCard } from "./RecentActivityCard";

export function DashboardOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SystemStatusCard />
      <RecentActivityCard />
    </div>
  );
}
