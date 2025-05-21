
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import UserManagement from "./UserManagement";
import { DashboardStats } from "./dashboard/DashboardStats";
import { DashboardOverview } from "./dashboard/DashboardOverview";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    activeCheckIns: 0,
    pendingNotifications: 0
  });

  // Fetch dashboard stats from Supabase
  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        // Fetch real user count
        const { count: userCount, error: userError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        if (userError) throw userError;
        
        // Fetch real message count
        const { count: messageCount, error: messageError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true });
          
        if (messageError) throw messageError;
        
        // Fetch active check-ins (approximation)
        const { count: activeCheckIns, error: checkInsError } = await supabase
          .from('message_conditions')
          .select('*', { count: 'exact', head: true })
          .eq('active', true)
          .eq('condition_type', 'no_check_in');
          
        if (checkInsError) throw checkInsError;
        
        // Fetch pending notifications (sent_reminders within last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { count: notificationCount, error: notificationError } = await supabase
          .from('sent_reminders')
          .select('*', { count: 'exact', head: true })
          .gte('sent_at', yesterday.toISOString());
          
        if (notificationError) throw notificationError;

        setStats({
          totalUsers: userCount || 0,
          totalMessages: messageCount || 0,
          activeCheckIns: activeCheckIns || 0,
          pendingNotifications: notificationCount || 0
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    }
    
    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of system statistics and management tools.
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">Overview</TabsTrigger>
          <TabsTrigger value="users" className="flex-1 sm:flex-none">User Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <DashboardStats stats={stats} />
          <DashboardOverview />
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
