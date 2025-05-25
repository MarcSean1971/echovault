
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, CheckCircle, XCircle, Trash2 } from "lucide-react";
import UserTable from "./UserTable";
import UserStatsSection from "./UserStatsSection";
import { supabase } from "@/integrations/supabase/client";
import { UserStatsData } from "./types/admin";
import { toast } from "@/components/ui/use-toast";
import { useHoverEffects } from "@/hooks/useHoverEffects";

type ExtendedUserStatsData = UserStatsData & {
  unconfirmedEmails: number;
  usersWithoutProfiles: number;
  incompleteProfiles: number;
  completeProfiles: number;
};

export default function UserManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { getButtonHoverClasses } = useHoverEffects();
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

  const handleCleanupOrphanedUsers = async () => {
    setIsCleaningUp(true);
    try {
      console.log("Starting cleanup of orphaned auth users...");
      
      const { error } = await supabase.rpc('cleanup_orphaned_auth_users');
      
      if (error) {
        console.error("Error cleaning up orphaned users:", error);
        throw error;
      }

      console.log("Cleanup completed successfully");
      
      toast({
        title: "Cleanup completed",
        description: "Orphaned authentication records have been removed.",
      });

      // Refresh the user stats after cleanup
      await fetchUserStats();
    } catch (error: any) {
      console.error("Failed to cleanup orphaned users:", error);
      toast({
        title: "Cleanup failed",
        description: error.message || "Failed to cleanup orphaned users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="space-y-6">
      <UserManagementHeader 
        onCleanupOrphaned={handleCleanupOrphanedUsers}
        isCleaningUp={isCleaningUp}
        orphanedCount={userStats.usersWithoutProfiles}
      />
      <UserStatsSection stats={userStats} loading={loading} />
      <UserTabsCard userStats={userStats} />
    </div>
  );
}

function UserManagementHeader({ 
  onCleanupOrphaned, 
  isCleaningUp, 
  orphanedCount 
}: { 
  onCleanupOrphaned: () => void;
  isCleaningUp: boolean;
  orphanedCount: number;
}) {
  const { getButtonHoverClasses } = useHoverEffects();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 className="text-xl font-semibold">User Management</h3>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>
      {orphanedCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {orphanedCount} Orphaned Records
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={onCleanupOrphaned}
            disabled={isCleaningUp}
            className={getButtonHoverClasses('outline')}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isCleaningUp ? "Cleaning..." : "Cleanup"}
          </Button>
        </div>
      )}
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
