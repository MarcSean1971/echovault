
import UserStats from "./UserStats";
import { UserStatsData } from "./types/admin";

interface UserStatsSectionProps {
  stats: UserStatsData;
  loading: boolean;
}

export default function UserStatsSection({ stats, loading }: UserStatsSectionProps) {
  return <UserStats stats={stats} loading={loading} />;
}
