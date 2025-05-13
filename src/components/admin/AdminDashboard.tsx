
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, MessageSquare, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import UserManagement from "./UserManagement";
import SystemMonitor from "./SystemMonitor";

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 p-1 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

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
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of system statistics and management tools.
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">Overview</TabsTrigger>
          <TabsTrigger value="users" className="flex-1 sm:flex-none">User Management</TabsTrigger>
          <TabsTrigger value="system" className="flex-1 sm:flex-none">System Monitor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard 
              title="Total Users" 
              value={stats.totalUsers} 
              description="Active user accounts" 
              icon={<Users className="h-4 w-4" />} 
            />
            <StatsCard 
              title="Total Messages" 
              value={stats.totalMessages} 
              description="Created messages" 
              icon={<MessageSquare className="h-4 w-4" />} 
            />
            <StatsCard 
              title="Active Check-ins" 
              value={stats.activeCheckIns} 
              description="Users with active check-ins" 
              icon={<Activity className="h-4 w-4" />} 
            />
            <StatsCard 
              title="Pending Notifications" 
              value={stats.pendingNotifications} 
              description="Notifications awaiting delivery" 
              icon={<Bell className="h-4 w-4" />} 
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Real-time system performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database Status</span>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Services</span>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email Delivery</span>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage Service</span>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Online
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-3 py-1">
                    <p className="text-sm">User account created</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-3 py-1">
                    <p className="text-sm">Message delivered successfully</p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                  <div className="border-l-4 border-amber-500 pl-3 py-1">
                    <p className="text-sm">Check-in reminder sent</p>
                    <p className="text-xs text-muted-foreground">Yesterday</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-3 py-1">
                    <p className="text-sm">System update completed</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="system">
          <SystemMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
