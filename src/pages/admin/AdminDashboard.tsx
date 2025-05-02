
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminDisplayName } from "@/utils/adminUtils";
import { 
  Users, MessageSquare, Clock, Bell,
  ActivitySquare, BarChart3, ShieldAlert
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const adminName = getAdminDisplayName(user?.email);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingMessages: 0,
    sentMessages: 0,
    checkInsLast7Days: 0,
    systemEvents: 0
  });

  // Load dashboard stats
  useEffect(() => {
    // This would normally fetch from your backend/database
    // For now, we'll use placeholder data
    const mockStats = {
      totalUsers: 143,
      activeUsers: 48,
      pendingMessages: 27,
      sentMessages: 156,
      checkInsLast7Days: 32,
      systemEvents: 12
    };
    
    // Simulate loading time
    const timer = setTimeout(() => {
      setStats(mockStats);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {adminName}. Here's what's happening in your system.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={() => navigate('/admin/users')}>
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          <Button variant="destructive" size={isMobile ? "sm" : "default"} onClick={() => navigate('/admin/messages')}>
            <Bell className="h-4 w-4 mr-2" />
            System Alerts
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-500" />
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Total registered users
            </p>
            <div className="mt-2 text-sm font-semibold text-green-600">
              {stats.activeUsers} active in last 7 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MessageSquare className="h-4 w-4 mr-2 text-violet-500" />
              Message Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingMessages}</div>
            <p className="text-xs text-muted-foreground">
              Pending messages
            </p>
            <div className="mt-2 text-sm font-semibold">
              {stats.sentMessages} messages delivered to date
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-amber-500" />
              Check-In Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.checkInsLast7Days}</div>
            <p className="text-xs text-muted-foreground">
              Check-ins in the last 7 days
            </p>
            <div className="mt-2 text-sm font-semibold text-red-600">
              3 missed check-ins requiring attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <ActivitySquare className="h-4 w-4" />
            <span className={isMobile ? "hidden" : "inline"}>System Activity</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className={isMobile ? "hidden" : "inline"}>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className={isMobile ? "hidden" : "inline"}>Alerts</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent System Activity</CardTitle>
              <CardDescription>
                Review the latest system events and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between p-3 border-b">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">New user registration</p>
                      <p className="text-xs text-muted-foreground">john.doe@example.com</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
                
                <div className="flex justify-between p-3 border-b">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-violet-500" />
                    <div>
                      <p className="text-sm font-medium">Message scheduled</p>
                      <p className="text-xs text-muted-foreground">Scheduled for delivery on June 15, 2025</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">5 hours ago</span>
                </div>
                
                <div className="flex justify-between p-3 border-b">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Missed check-in alert</p>
                      <p className="text-xs text-muted-foreground">User: sarah.wilson@example.com</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">8 hours ago</span>
                </div>
                
                <div className="flex justify-between p-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Admin login</p>
                      <p className="text-xs text-muted-foreground">marc.s@seelenbinderconsulting.com</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">1 day ago</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All System Activity
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>
                Usage patterns and system metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[200px] flex items-center justify-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground text-center">
                  Analytics charts would be displayed here<br/>
                  <span className="text-xs">Connect your data source to view real-time analytics</span>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium">Messages Created</p>
                  <p className="text-2xl font-bold">183</p>
                  <p className="text-xs text-green-600">↑ 12% from last month</p>
                </div>
                
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium">Check-in Compliance</p>
                  <p className="text-2xl font-bold">94%</p>
                  <p className="text-xs text-amber-600">↓ 2% from last month</p>
                </div>
                
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium">Avg. Response Time</p>
                  <p className="text-2xl font-bold">1.4s</p>
                  <p className="text-xs text-green-600">↑ 0.3s faster than last month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Critical events requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
                  <div className="flex items-start gap-4">
                    <Bell className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-700 dark:text-red-400">Missed Check-in Alert</h4>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        User sarah.wilson@example.com has missed 3 consecutive check-ins.
                        Their messages will be delivered in 24 hours unless action is taken.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="destructive">Review</Button>
                        <Button size="sm" variant="outline">Dismiss</Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
                  <div className="flex items-start gap-4">
                    <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-700 dark:text-amber-400">System Storage Alert</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Storage usage approaching 85% of allocated capacity.
                        Consider upgrading your plan or cleaning up unused files.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="default">Manage Storage</Button>
                        <Button size="sm" variant="outline">Dismiss</Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
                  <div className="flex items-start gap-4">
                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-700 dark:text-blue-400">Maintenance Notice</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Scheduled maintenance will occur on May 10, 2025 from 2:00 AM to 4:00 AM UTC.
                        Some system features may be temporarily unavailable.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">View Details</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
