
import { Separator } from "@/components/ui/separator";
import { formatReminderTime } from "@/components/message/FormSections/DeadManSwitchComponents/reminder/TimeConversionUtils";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Lock } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useIsMobile } from "@/hooks/use-mobile";

interface MessageDeliverySettingsProps {
  condition: any | null;
  renderConditionType: () => string;
  formatDate: (dateString: string) => string;
  showInTabs?: boolean;
}

export function MessageDeliverySettings({
  condition,
  renderConditionType,
  formatDate,
  showInTabs = false
}: MessageDeliverySettingsProps) {
  const isMobile = useIsMobile();
  
  if (!condition) {
    return (
      <div className="space-y-6 pt-2">
        <p className="text-muted-foreground">No delivery settings configured for this message.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${showInTabs ? 'pt-0' : 'pt-2'}`}>
      <div className="grid grid-cols-1 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="font-medium">Type:</span>
          <span className="text-right">{renderConditionType()}</span>
        </div>
        
        {condition.condition_type === 'no_check_in' && (
          <>
            <div className="flex justify-between">
              <span className="font-medium">Check-in period:</span>
              <span className="text-right">
                {condition.hours_threshold} hours
                {condition.minutes_threshold ? ` ${condition.minutes_threshold} minutes` : ''}
              </span>
            </div>
            
            {/* Show reminder settings directly after check-in period */}
            {condition.reminder_hours && condition.reminder_hours.length > 0 && (
              <div className="flex flex-col">
                <span className="font-medium">Reminder settings:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {condition.reminder_hours.sort((a: number, b: number) => b - a).map((minutes: number) => (
                    <Badge 
                      key={minutes} 
                      variant="secondary" 
                      className={`text-xs hover:bg-slate-200 ${HOVER_TRANSITION}`}
                    >
                      {formatReminderTime(minutes)} before deadline
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        {condition.recurring_pattern && (
          <div className="flex justify-between">
            <span className="font-medium">Recurring:</span>
            <span className="text-right">
              {condition.recurring_pattern.type} 
              {condition.recurring_pattern.interval > 1 ? 
                ` (every ${condition.recurring_pattern.interval} ${condition.recurring_pattern.type.slice(0, -2)}s)` : 
                ''}
            </span>
          </div>
        )}
        
        {condition.trigger_date && (
          <div className="flex justify-between">
            <span className="font-medium">Scheduled date:</span>
            <span className="text-right">
              {formatDate(condition.trigger_date)}
            </span>
          </div>
        )}
      </div>
      
      {/* Security settings section - Now showing PIN code here */}
      {(condition.expiry_hours > 0 || condition.unlock_delay_hours > 0 || condition.pin_code) && (
        <>
          <Separator className="my-4" />
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <Lock className={`h-4 w-4 text-muted-foreground ${HOVER_TRANSITION}`} />
              <p className="font-medium">Security Settings</p>
            </div>
            
            {condition.pin_code && (
              <div className="text-sm">
                <p className="font-medium">PIN Code</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                    {condition.pin_code}
                  </code>
                  <span className="text-xs text-muted-foreground">
                    Recipients will need this PIN to access the message
                  </span>
                </div>
              </div>
            )}
            
            {condition.expiry_hours > 0 && (
              <div className="text-sm">
                <p className="font-medium">Message Expiry</p>
                <p className="text-muted-foreground">
                  This message will expire {condition.expiry_hours} hours after delivery.
                </p>
              </div>
            )}
            
            {condition.unlock_delay_hours > 0 && (
              <div className="text-sm">
                <p className="font-medium">Delay Settings</p>
                <p className="text-muted-foreground">
                  Recipients will need to wait {condition.unlock_delay_hours} hours after delivery to view this message.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
