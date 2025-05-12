
import { Separator } from "@/components/ui/separator";
import { formatReminderTime } from "@/components/message/FormSections/DeadManSwitchComponents/reminder/TimeConversionUtils";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

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
          <div className="flex justify-between">
            <span className="font-medium">Check-in period:</span>
            <span className="text-right">
              {condition.hours_threshold} hours
              {condition.minutes_threshold ? ` ${condition.minutes_threshold} minutes` : ''}
            </span>
          </div>
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
      
      {/* Reminder settings section - Now positioned after check-in period */}
      {condition.reminder_hours && condition.reminder_hours.length > 0 && (
        <>
          <Separator className="my-4" />
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <Clock className={`h-4 w-4 text-muted-foreground ${HOVER_TRANSITION}`} />
              <p className="font-medium">Reminder Settings</p>
            </div>
            <p className="text-muted-foreground mt-1 mb-2">
              Reminders will be sent to recipients before the message triggers.
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
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
        </>
      )}
      
      {/* Security settings section */}
      {(condition.expiry_hours > 0 || condition.unlock_delay_hours > 0 || condition.pin_code) && (
        <>
          <Separator className="my-4" />
          <div className="flex flex-col gap-3">
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
            
            {condition.pin_code && (
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path><path d="m9 12 2 2 4-4"></path></svg>
                  <p className="font-medium">PIN Protection</p>
                </div>
                <p className="text-muted-foreground">
                  Recipients will need to enter a PIN to access this message.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
