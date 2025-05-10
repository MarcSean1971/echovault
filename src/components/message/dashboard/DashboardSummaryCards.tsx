
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MessageCondition, MessageDeliveryStatus } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface DashboardSummaryCardsProps {
  nextDeadline: Date | null;
  lastCheckIn: string | null;
  conditions: MessageCondition[];
  onCheckIn: () => Promise<void>;
}

export function DashboardSummaryCards({
  nextDeadline,
  lastCheckIn,
  conditions,
  onCheckIn
}: DashboardSummaryCardsProps) {
  // Count armed conditions
  const armedCount = conditions.filter(c => c.active).length;
  
  // Calculate time remaining until next deadline
  const formatTimeRemaining = () => {
    if (!nextDeadline) return "No active deadlines";
    
    try {
      return formatDistanceToNow(new Date(nextDeadline), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting deadline:", error);
      return "Invalid date";
    }
  };

  // Format last check-in time
  const formatLastCheckIn = () => {
    if (!lastCheckIn) return "Never checked in";
    
    try {
      return formatDistanceToNow(new Date(lastCheckIn), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting check-in:", error);
      return "Invalid date";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Next Deadline</h3>
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <p className={nextDeadline && new Date(nextDeadline) < new Date() 
            ? "text-red-500 font-bold text-lg"
            : "text-lg"}>
            {formatTimeRemaining()}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Last Check-In</h3>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-lg">{formatLastCheckIn()}</p>
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            onClick={onCheckIn}
            className={`w-full ${HOVER_TRANSITION}`}
            variant="outline"
          >
            Check In Now
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Armed Messages</h3>
            <AlertTriangle className={`h-5 w-5 ${armedCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </div>
          <p className="text-lg">{armedCount} message{armedCount !== 1 ? "s" : ""} armed</p>
        </CardContent>
      </Card>
    </div>
  );
}
