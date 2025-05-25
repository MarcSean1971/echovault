
import { useNavigate } from "react-router-dom";
import { StatsCard } from "./StatsCard";
import { Activity, Users, MessageSquare, Bell } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalUsers: number;
    totalMessages: number;
    activeCheckIns: number;
    pendingNotifications: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const navigate = useNavigate();

  const handleMessagesClick = () => {
    navigate('/messages');
  };

  const handleRecipientsClick = () => {
    navigate('/recipients');
  };

  return (
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
        clickable={true}
        onClick={handleMessagesClick}
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
  );
}
