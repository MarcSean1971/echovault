
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BellRing, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Reminder } from '@/services/messages/reminder'; // Changed from reminderService to reminder
import { format, parseISO, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

interface SystemStatusCardsProps {
  sentReminders: Reminder[];
  isLoading: boolean;
}

export function SystemStatusCards({ sentReminders, isLoading }: SystemStatusCardsProps) {
  const now = new Date();
  
  // Analyze reminder activity to determine system health
  const reminderStats = React.useMemo(() => {
    if (!sentReminders || sentReminders.length === 0) {
      return {
        total24h: 0,
        total7d: 0,
        lastReminder: null,
        minutesSinceLastReminder: null,
        status: 'unknown' as 'healthy' | 'warning' | 'critical' | 'unknown'
      };
    }
    
    // Sort reminders by sent_at (newest first)
    const sortedReminders = [...sentReminders].sort(
      (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
    );
    
    const lastReminder = sortedReminders[0];
    
    // Count reminders in the last 24 hours and 7 days
    const last24h = sortedReminders.filter(reminder => {
      const sentDate = parseISO(reminder.sent_at);
      return differenceInHours(now, sentDate) <= 24;
    }).length;
    
    const last7d = sortedReminders.filter(reminder => {
      const sentDate = parseISO(reminder.sent_at);
      return differenceInDays(now, sentDate) <= 7;
    }).length;
    
    let minutesSinceLast = null;
    let status: 'healthy' | 'warning' | 'critical' | 'unknown' = 'unknown';
    
    if (lastReminder) {
      const lastReminderDate = parseISO(lastReminder.sent_at);
      minutesSinceLast = differenceInMinutes(now, lastReminderDate);
      
      // Determine system status based on last reminder
      if (minutesSinceLast < 60) {
        status = 'healthy';  // Less than 1 hour: healthy
      } else if (minutesSinceLast < 180) {
        status = 'warning';  // 1-3 hours: warning
      } else {
        status = 'critical'; // More than 3 hours: critical
      }
    }
    
    return {
      total24h: last24h,
      total7d: last7d,
      lastReminder,
      minutesSinceLastReminder: minutesSinceLast,
      status
    };
  }, [sentReminders]);
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch(status) {
      case 'healthy': return 'bg-green-100 dark:bg-green-900/20';
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/20';
      case 'critical': return 'bg-red-100 dark:bg-red-900/20';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* System Health Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            {reminderStats.status === 'healthy' && (
              <CheckCircle className="h-6 w-6 text-green-500" />
            )}
            {reminderStats.status === 'warning' && (
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            )}
            {reminderStats.status === 'critical' && (
              <AlertCircle className="h-6 w-6 text-red-500" />
            )}
            {reminderStats.status === 'unknown' && (
              <AlertCircle className="h-6 w-6 text-gray-500" />
            )}
            <span className={`text-xl font-bold capitalize ${getStatusColor(reminderStats.status)}`}>
              {reminderStats.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {reminderStats.status === 'unknown'
              ? "No activity data available"
              : reminderStats.status === 'healthy'
                ? "All systems operating normally"
                : reminderStats.status === 'warning'
                  ? "System activity detected but delayed"
                  : "System activity significantly delayed"}
          </p>
        </CardContent>
      </Card>

      {/* Last Cron Execution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Last Reminder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {reminderStats.lastReminder ? (
              format(parseISO(reminderStats.lastReminder.sent_at), 'HH:mm:ss')
            ) : (
              "No data"
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {reminderStats.minutesSinceLastReminder !== null ? (
              `${reminderStats.minutesSinceLastReminder} minutes ago`
            ) : (
              "No recent activity"
            )}
          </p>
        </CardContent>
      </Card>

      {/* 24h Reminder Count */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">24h Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 items-center">
            <BellRing className="h-5 w-5 text-blue-500" />
            <div className="text-2xl font-bold">{reminderStats.total24h}</div>
          </div>
          <p className="text-xs text-muted-foreground">Reminders sent in last 24h</p>
        </CardContent>
      </Card>

      {/* Cron Schedule Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cron Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-md ${getStatusBgColor(reminderStats.status)}`}>
            <Clock className={`h-5 w-5 ${getStatusColor(reminderStats.status)}`} />
            <div className="font-medium">
              Running every minute
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Last verified: {format(now, 'MMM d, yyyy HH:mm')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
