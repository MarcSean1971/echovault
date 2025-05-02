
import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";
import { MessageCondition } from "@/types/message";

interface SystemStatusCardProps {
  lastCheckIn: string | null;
  nextDeadline: Date | null;
  conditions: MessageCondition[];
  isLoading: boolean;
}

export function SystemStatusCard({ 
  lastCheckIn, 
  nextDeadline, 
  conditions,
  isLoading 
}: SystemStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <p>Last Check-In:</p>
            <p className="text-sm font-medium">
              {lastCheckIn ? 
                formatDistanceToNow(new Date(lastCheckIn), { addSuffix: true }) : 
                "No recent check-ins"}
            </p>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <p>Next Check-In Required:</p>
            <p className="text-sm font-medium">
              {nextDeadline ? 
                formatDistanceToNow(nextDeadline, { addSuffix: true }) : 
                "No active deadlines"}
            </p>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <p>Active Conditions:</p>
            <p className="text-sm font-medium">
              {conditions.filter(c => c.active).length} Messages
            </p>
          </div>
          <div className="flex justify-between items-center py-2">
            <p>Status:</p>
            <p className="text-sm font-medium text-green-500">
              {isLoading ? 
                "Loading..." : 
                nextDeadline ? "System Armed and Monitoring" : "No active triggers"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
