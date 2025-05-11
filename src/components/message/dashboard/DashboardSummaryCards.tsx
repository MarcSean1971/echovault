
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCondition, MessageDeliveryStatus } from "@/types/message";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

interface DashboardSummaryCardsProps {
  nextDeadline: Date | null;
  lastCheckIn: string | null;
  conditions: MessageCondition[];
  onCheckIn: () => Promise<void>;
}

// Helper function to determine message status
const getMessageStatus = (condition: MessageCondition): MessageDeliveryStatus => {
  if (!condition.active) return 'cancelled';
  if (condition.delivered) return 'delivered';
  if (condition.triggered) return 'triggered';
  return 'armed';
};

export function DashboardSummaryCards({ 
  nextDeadline, 
  lastCheckIn, 
  conditions, 
  onCheckIn 
}: DashboardSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Next Check-in Deadline</CardTitle>
        </CardHeader>
        <CardContent>
          {nextDeadline ? (
            <div className="flex flex-col">
              <span className="text-3xl font-bold">
                {formatDistanceToNow(nextDeadline, { addSuffix: true })}
              </span>
              <span className="text-sm text-muted-foreground">
                {format(nextDeadline, 'PPpp')}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">No active check-in deadlines</span>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={onCheckIn} 
            className={`w-full ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
          >
            Check In Now
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Last Check-in</CardTitle>
        </CardHeader>
        <CardContent>
          {lastCheckIn ? (
            <div className="flex flex-col">
              <span className="text-3xl font-bold">
                {formatDistanceToNow(new Date(lastCheckIn), { addSuffix: true })}
              </span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(lastCheckIn), 'PPpp')}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">No recent check-ins</span>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Message Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span>Armed:</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {conditions.filter(c => getMessageStatus(c) === 'armed').length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivered:</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {conditions.filter(c => getMessageStatus(c) === 'delivered').length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Triggered:</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                {conditions.filter(c => getMessageStatus(c) === 'triggered').length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
