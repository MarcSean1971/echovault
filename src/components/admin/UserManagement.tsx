
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import UserTable from "./UserTable";
import UserStats from "./UserStats";
import { supabase } from "@/integrations/supabase/client";

interface UserStatsData {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
}

export default function UserManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStatsData>({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0
  });

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all users to calculate stats
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      if (profiles) {
        const now = new Date();
        const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
        const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
        
        const activeUsers = profiles.filter(profile => {
          const updatedAt = new Date(profile.updated_at);
          return updatedAt >= oneMonthAgo;
        });

        const newUsers = profiles.filter(profile => {
          const createdAt = new Date(profile.created_at);
          return createdAt >= oneWeekAgo;
        });

        setUserStats({
          totalUsers: profiles.length,
          activeUsers: activeUsers.length,
          newUsers: newUsers.length
        });
      }
    } catch (err: any) {
      console.error("Error fetching user stats:", err);
      setError(err.message || "Failed to fetch user statistics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold">User Management</h3>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
      </div>

      <UserStats stats={userStats} loading={loading} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4 w-full sm:w-auto">
              <TabsTrigger value="all" className="flex-1 sm:flex-none">
                All Users
                <Badge variant="secondary" className="ml-2">{userStats.totalUsers}</Badge>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex-1 sm:flex-none">
                Active
                <Badge variant="secondary" className="ml-2">{userStats.activeUsers}</Badge>
              </TabsTrigger>
              <TabsTrigger value="new" className="flex-1 sm:flex-none">
                New
                <Badge variant="secondary" className="ml-2">{userStats.newUsers}</Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <UserTable filter="all" />
            </TabsContent>
            
            <TabsContent value="active" className="mt-0">
              <UserTable filter="active" />
            </TabsContent>
            
            <TabsContent value="new" className="mt-0">
              <UserTable filter="new" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
