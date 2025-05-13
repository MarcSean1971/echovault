
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
            
            {/* Fixed: Show reminder settings in same format as other settings */}
            {condition.reminder_hours && condition.reminder_hours.length > 0 && (
              <div className="flex justify-between">
                <span className="font-medium">Reminder settings:</span>
                <span className="text-right">
                  {condition.reminder_hours.sort((a: number, b: number) => b - a)
                    .map((minutes: number) => formatReminderTime(minutes))
                    .join(', ')}
                </span>
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
      
      {/* Security settings section - Now with consistent heading style */}
      {(condition.expiry_hours > 0 || condition.unlock_delay_hours > 0 || condition.pin_code) && (
        <>
          <Separator className="my-4" />
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
            <Lock className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
            Security Settings
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {condition.pin_code && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">PIN Code:</span>
                <span className="text-right">
                  {condition.pin_code}
                </span>
              </div>
            )}
            
            {condition.expiry_hours > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">Message Expiry:</span>
                <span className="text-right">
                  {condition.expiry_hours} hours after delivery
                </span>
              </div>
            )}
            
            {condition.unlock_delay_hours > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">Delay Settings:</span>
                <span className="text-right">
                  {condition.unlock_delay_hours} hours after delivery
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
