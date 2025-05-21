import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserPlus } from "lucide-react";
import { UserStatsData } from "./types/admin";

interface UserStatsProps {
  stats: UserStatsData;
  loading: boolean;
}

export default function UserStats({ stats, loading }: UserStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="h-10 w-10 rounded-lg bg-primary/10 p-2 mr-4 flex items-center justify-center text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Users</p>
            {loading ? (
              <div className="h-6 w-12 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="h-10 w-10 rounded-lg bg-primary/10 p-2 mr-4 flex items-center justify-center text-primary">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Users</p>
            {loading ? (
              <div className="h-6 w-12 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            )}
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="h-10 w-10 rounded-lg bg-primary/10 p-2 mr-4 flex items-center justify-center text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">New Users</p>
            {loading ? (
              <div className="h-6 w-12 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-bold">{stats.newUsers}</p>
            )}
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
