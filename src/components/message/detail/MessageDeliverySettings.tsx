
import { Separator } from "@/components/ui/separator";

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

  const deliverySettingsContent = (
    <div className="space-y-6">
      <div>
        <h3 className="text-md font-medium mb-2">Delivery Method</h3>
        <div className="bg-muted/50 p-3 md:p-4 rounded-md">
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium">Type:</span>
              <span className="col-span-2">{renderConditionType()}</span>
            </div>
            
            {condition.condition_type === 'no_check_in' && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Check-in period:</span>
                <span className="col-span-2">
                  {condition.hours_threshold} hours
                  {condition.minutes_threshold ? ` ${condition.minutes_threshold} minutes` : ''}
                </span>
              </div>
            )}
            
            {/* Only show reminders if the condition type is NOT 'panic_trigger' */}
            {condition.reminder_hours && 
             condition.reminder_hours.length > 0 && 
             condition.condition_type !== 'panic_trigger' && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Reminders:</span>
                <span className="col-span-2">
                  {condition.reminder_hours.map((hours: number) => `${hours}h`).join(', ')} before deadline
                </span>
              </div>
            )}
            
            {condition.recurring_pattern && (
              <div className="grid grid-cols-3 gap-2">
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
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Scheduled date:</span>
                <span className="col-span-2">
                  {formatDate(condition.trigger_date)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {condition.expiry_hours > 0 && (
          <div className="p-3 rounded-md bg-muted/30 text-sm">
            <p className="font-medium mb-1">Message Expiry</p>
            <p className="text-muted-foreground">
              This message will expire {condition.expiry_hours} hours after delivery.
            </p>
          </div>
        )}
        
        {condition.unlock_delay_hours > 0 && (
          <div className="p-3 rounded-md bg-muted/30 text-sm">
            <p className="font-medium mb-1">Delay Settings</p>
            <p className="text-muted-foreground">
              Recipients will need to wait {condition.unlock_delay_hours} hours after delivery to view this message.
            </p>
          </div>
        )}
        
        {condition.pin_code && (
          <div className="p-3 rounded-md bg-muted/30 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path><path d="m9 12 2 2 4-4"></path></svg>
              <p className="font-medium">PIN Protection</p>
            </div>
            <p className="text-muted-foreground">
              Recipients will need to enter a PIN to access this message.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return deliverySettingsContent;
}
