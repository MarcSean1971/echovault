
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  ZAxis
} from 'recharts';
import { parseISO, format, addHours, subHours } from 'date-fns';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Activity, Bell, Calendar } from 'lucide-react';
import { Reminder } from '@/services/messages/reminderService';

interface CronExecution {
  timestamp: string;
  name: string;
  status: 'success' | 'failure';
  details?: string;
}

interface UpcomingReminder {
  messageId: string;
  timestamp: string;
  title: string;
}

interface SystemTimelineChartProps {
  cronExecutions: CronExecution[];
  sentReminders: Reminder[];
  upcomingReminders: UpcomingReminder[];
  timeframe: '24h' | '7d' | '30d';
}

export function SystemTimelineChart({
  cronExecutions,
  sentReminders,
  upcomingReminders,
  timeframe
}: SystemTimelineChartProps) {
  // Set up time range for the chart
  const now = new Date();
  const [startTime, setStartTime] = useState<Date>(
    timeframe === '24h' ? subHours(now, 24) : 
    timeframe === '7d' ? subHours(now, 24 * 7) : 
    subHours(now, 24 * 30)
  );
  const [endTime, setEndTime] = useState<Date>(
    timeframe === '24h' ? addHours(now, 6) : 
    timeframe === '7d' ? addHours(now, 24) : 
    addHours(now, 24 * 2)
  );

  useEffect(() => {
    // Update time range when timeframe changes
    const newNow = new Date();
    setStartTime(
      timeframe === '24h' ? subHours(newNow, 24) : 
      timeframe === '7d' ? subHours(newNow, 24 * 7) : 
      subHours(newNow, 24 * 30)
    );
    setEndTime(
      timeframe === '24h' ? addHours(newNow, 6) : 
      timeframe === '7d' ? addHours(newNow, 24) : 
      addHours(newNow, 24 * 2)
    );
  }, [timeframe]);

  // Create a map of y-axis values for different types of events
  const eventTypes = {
    'cron-every-minute': 1,
    'reminder': 2,
    'upcoming': 3,
  };

  // Format data for the chart
  const chartData = useMemo(() => {
    const data: any[] = [];
    
    // Add cron executions
    cronExecutions.forEach((execution) => {
      const time = new Date(execution.timestamp);
      if (time >= startTime && time <= endTime) {
        data.push({
          x: time.getTime(),
          y: eventTypes[execution.name as keyof typeof eventTypes] || 4,
          type: 'cron',
          name: execution.name,
          status: execution.status,
          details: execution.details,
          timestamp: execution.timestamp,
        });
      }
    });
    
    // Add sent reminders
    sentReminders.forEach((reminder) => {
      const time = new Date(reminder.sent_at);
      if (time >= startTime && time <= endTime) {
        data.push({
          x: time.getTime(),
          y: eventTypes['reminder'],
          type: 'reminder',
          name: 'Reminder Sent',
          details: `Message: ${reminder.message_id}`,
          timestamp: reminder.sent_at,
        });
      }
    });
    
    // Add upcoming reminders
    upcomingReminders.forEach((reminder) => {
      const time = new Date(reminder.timestamp);
      if (time >= startTime && time <= endTime) {
        data.push({
          x: time.getTime(),
          y: eventTypes['upcoming'],
          type: 'upcoming',
          name: `Scheduled: ${reminder.title.substring(0, 30)}...`,
          details: `Message: ${reminder.messageId}`,
          timestamp: reminder.timestamp,
        });
      }
    });
    
    return data;
  }, [cronExecutions, sentReminders, upcomingReminders, startTime, endTime]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }
    
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-background border rounded-md shadow-md text-sm">
        <p className="font-medium">{data.name}</p>
        <p>{format(new Date(data.timestamp), 'MMM d, yyyy HH:mm:ss')}</p>
        {data.details && <p className="text-muted-foreground text-xs">{data.details}</p>}
        {data.status && (
          <div className="flex items-center mt-1">
            <span className={`h-2 w-2 rounded-full mr-1 ${data.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{data.status}</span>
          </div>
        )}
      </div>
    );
  };
  
  const chartConfig = {
    cron: {
      label: "Cron Jobs",
      theme: { 
        light: "#3B82F6",
        dark: "#60A5FA"
      }
    },
    reminder: {
      label: "Sent Reminders", 
      theme: {
        light: "#10B981",
        dark: "#34D399"
      }
    },
    upcoming: {
      label: "Upcoming Reminders",
      theme: {
        light: "#EC4899",
        dark: "#F472B6"
      }
    }
  };

  // Custom shape for scatter points
  const renderCustomShape = (props: any) => {
    const { cx, cy, payload } = props;
    
    const size = 6;
    
    // Different symbols for different types
    if (payload.type === 'cron') {
      return <rect x={cx - size/2} y={cy - size/2} width={size} height={size} fill="#3B82F6" />;
    }
    
    if (payload.type === 'reminder') {
      return <circle cx={cx} cy={cy} r={size/2} fill="#10B981" />;
    }
    
    if (payload.type === 'upcoming') {
      return (
        <polygon 
          points={`${cx},${cy-size/2} ${cx+size/2},${cy+size/2} ${cx-size/2},${cy+size/2}`} 
          fill="#EC4899" 
        />
      );
    }
    
    // Default fallback
    return <circle cx={cx} cy={cy} r={size/2} fill="#9333EA" />;
  };

  // Format date for x-axis
  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    return format(date, timeframe === '24h' ? 'HH:mm' : 'MM/dd HH:mm');
  };

  // Format categories for y-axis
  const formatYAxis = (value: number) => {
    switch(value) {
      case 1: return 'Cron Jobs';
      case 2: return 'Sent Reminders';
      case 3: return 'Upcoming';
      default: return '';
    }
  };

  return (
    <div className="h-full w-full">
      <ChartContainer 
        config={chartConfig}
      >
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart
            margin={{ top: 20, right: 30, bottom: 20, left: 120 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              name="Time" 
              type="number"
              domain={[startTime.getTime(), endTime.getTime()]}
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
              label={{ value: 'Time', position: 'bottom', offset: 0 }}
            />
            <YAxis 
              dataKey="y" 
              name="Event Type" 
              type="number"
              domain={[0, 4]}
              tickCount={4}
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} />
            
            {/* Reference line for current time */}
            <ReferenceLine
              x={now.getTime()}
              stroke="#F43F5E"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{ value: 'Now', position: 'insideTopRight', fill: '#F43F5E' }}
            />
            
            {/* Scatter points for different event types */}
            <Scatter 
              name="Cron Jobs" 
              data={chartData.filter(item => item.type === 'cron')}
              fill="#3B82F6"
              shape={renderCustomShape}
            />
            <Scatter 
              name="Sent Reminders" 
              data={chartData.filter(item => item.type === 'reminder')}
              fill="#10B981"
              shape={renderCustomShape}
            />
            <Scatter 
              name="Upcoming Reminders" 
              data={chartData.filter(item => item.type === 'upcoming')}
              fill="#EC4899"
              shape={renderCustomShape}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
