
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Bell } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { MessageTimer } from "@/components/message/MessageTimer";

interface DeliverySettingsSectionProps {
  condition: any;
  messageId?: string; // Add messageId
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  deadline: Date | null;
  isArmed?: boolean;
  refreshTrigger?: number;
}

export function DeliverySettingsSection({
  condition,
  messageId,
  formatDate,
  renderConditionType,
  deadline,
  isArmed = false,
  refreshTrigger,
}: DeliverySettingsSectionProps) {
  const isMobile = useIsMobile();
  const isDeadmanSwitch = condition?.condition_type === 'no_check_in';
  
  if (!condition) return null;

  return (
    <Card className="overflow-hidden border border-border/50 shadow-sm">
      <CardHeader className="bg-muted/30 px-4 py-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center">
          <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
          <span>Delivery Settings</span>
        </CardTitle>
        <Badge 
          variant="outline" 
          className={cn(
            "font-normal text-xs",
            isArmed ? "bg-amber-400/10 border-amber-400 text-amber-700" : "bg-muted"
          )}
        >
          {renderConditionType()}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium mb-1">Condition Type</div>
              <div className="text-sm text-muted-foreground">
                {condition.condition_type === 'no_check_in' ? (
                  <div className="flex items-center">
                    <Bell className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                    <span>Deadman's Switch</span>
                  </div>
                ) : (
                  renderConditionType()
                )}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-1">Status</div>
              <div className="text-sm">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "font-normal",
                    isArmed ? "bg-amber-400/10 text-amber-700" : "bg-muted"
                  )}
                >
                  {isArmed ? 'ARMED' : 'DISARMED'}
                </Badge>
              </div>
            </div>
            
            {/* Show threshold for no_check_in conditions */}
            {condition.condition_type === 'no_check_in' && (
              <div>
                <div className="text-sm font-medium mb-1">Check-in Threshold</div>
                <div className="text-sm text-muted-foreground">
                  {condition.hours_threshold || 0} hours {condition.minutes_threshold || 0} minutes
                </div>
              </div>
            )}
          </div>
          
          {/* Right column - Timer */}
          <div className={cn(
            "space-y-3",
            isMobile ? "order-first" : ""
          )}>
            <div className="text-sm font-medium mb-1">Countdown Timer</div>
            <MessageTimer 
              deadline={deadline} 
              isArmed={isArmed} 
              messageId={messageId} 
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
