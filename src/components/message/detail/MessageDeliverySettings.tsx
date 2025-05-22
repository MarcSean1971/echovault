
import { Separator } from "@/components/ui/separator";
import { formatReminderTime } from "@/components/message/FormSections/DeadManSwitchComponents/reminder/TimeConversionUtils";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Lock } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useIsMobile } from "@/hooks/use-mobile";
import { AccordionSection } from "@/components/message/detail/AccordionSection";

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
      <div className="space-y-2 pt-2">
        <p className="text-muted-foreground">No delivery settings configured for this message.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${showInTabs ? 'pt-0' : 'pt-2'}`}>
      <div className="grid grid-cols-1 gap-1 text-sm">
        <div className="grid grid-cols-3 gap-1">
          <span className="font-medium">Type:</span>
          <span className="col-span-2">{renderConditionType()}</span>
        </div>
        
        {condition.condition_type === 'no_check_in' && (
          <>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-medium">Check-in period:</span>
              <span className="col-span-2">
                {condition.hours_threshold} hours
                {condition.minutes_threshold ? ` ${condition.minutes_threshold} minutes` : ''}
              </span>
            </div>
            
            {/* Fixed: Show reminder settings in same format as other settings */}
            {condition.reminder_hours && condition.reminder_hours.length > 0 && (
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium">Reminder settings:</span>
                <span className="col-span-2">
                  {condition.reminder_hours.sort((a: number, b: number) => b - a)
                    .map((minutes: number) => formatReminderTime(minutes))
                    .join(', ')}
                </span>
              </div>
            )}
          </>
        )}
        
        {condition.recurring_pattern && (
          <div className="grid grid-cols-3 gap-1">
            <span className="font-medium">Recurring:</span>
            <span className="col-span-2">
              {condition.recurring_pattern.type} 
              {condition.recurring_pattern.interval > 1 ? 
                ` (every ${condition.recurring_pattern.interval} ${condition.recurring_pattern.type.slice(0, -2)}s)` : 
                ''}
            </span>
          </div>
        )}
        
        {condition.trigger_date && (
          <div className="grid grid-cols-3 gap-1">
            <span className="font-medium">Scheduled date:</span>
            <span className="col-span-2">
              {formatDate(condition.trigger_date)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
