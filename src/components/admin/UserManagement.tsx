
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, CheckCircle, XCircle } from "lucide-react";
import UserTable from "./UserTable";
import UserStatsSection from "./UserStatsSection";
import { supabase } from "@/integrations/supabase/client";
import { UserStatsData } from "./types/admin";

type ExtendedUserStatsData = UserStatsData & {
  unconfirmedEmails: number;
  usersWithoutProfiles: number;
  incompleteProfiles: number;
  completeProfiles: number;
};

export default function UserManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<ExtendedUserStatsData>({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    unconfirmedEmails: 0,
    usersWithoutProfiles: 0,
    incompleteProfiles: 0,
    completeProfiles: 0
  });

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      
      // Get all users from auth.users via our function
      const { data: authUsers, error: usersError } = await supabase.rpc('get_all_users_admin');

      if (usersError) throw usersError;

      if (authUsers) {
        const now = new Date();
        const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
        const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
        
        const activeUsers = authUsers.filter(user => {
          return user.last_sign_in_at && new Date(user.last_sign_in_at) >= oneMonthAgo;
        });

        const newUsers = authUsers.filter(user => {
          return new Date(user.created_at) >= oneWeekAgo;
        });

        const unconfirmedEmails = authUsers.filter(user => !user.email_confirmed_at);
        const usersWithoutProfiles = authUsers.filter(user => !user.has_profile);
        const incompleteProfiles = authUsers.filter(user => user.has_profile && !user.profile_complete);
        const completeProfiles = authUsers.filter(user => user.profile_complete);

        setUserStats({
          totalUsers: authUsers.length,
          activeUsers: activeUsers.length,
          newUsers: newUsers.length,
          unconfirmedEmails: unconfirmedEmails.length,
          usersWithoutProfiles: usersWithoutProfiles.length,
          incompleteProfiles: incompleteProfiles.length,
          completeProfiles: completeProfiles.length
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
      <UserManagementHeader />
      <UserStatsSection stats={userStats} loading={loading} />
      <UserTabsCard userStats={userStats} />
    </div>
  );
}

function UserManagementHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 className="text-xl font-semibold">User Management</h3>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>
    </div>
  );
}

function UserTabsCard({ userStats }: { userStats: ExtendedUserStatsData }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Users</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline">
            {userStats.unconfirmedEmails} Unconfirmed Emails
          </Badge>
          <Badge variant="outline">
            {userStats.usersWithoutProfiles} No Profiles
          </Badge>
          <Badge variant="outline">
            {userStats.incompleteProfiles} Incomplete Profiles
          </Badge>
          <Badge variant="outline">
            {userStats.completeProfiles} Complete Profiles
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
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
  );
}
