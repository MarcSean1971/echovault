
import React from "react";
import { Clock } from "lucide-react";
import { MessageDeliverySettings } from "../../MessageDeliverySettings";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useNextReminders } from "@/hooks/useNextReminders"; 
import { parseReminderMinutes } from "@/utils/reminderUtils";

interface DeliverySettingsSectionProps {
  condition: any | null;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  deadline?: Date | null;
  isArmed?: boolean;
  refreshTrigger?: number;
}

export function DeliverySettingsSection({
  condition,
  formatDate,
  renderConditionType,
  deadline,
  isArmed = false,
  refreshTrigger
}: DeliverySettingsSectionProps) {
  if (!condition) {
    return null;
  }
  
  // Parse reminder minutes from the condition
  const reminderMinutes = parseReminderMinutes(condition?.reminder_hours);
  
  // Get upcoming reminder information
  const { upcomingReminders, hasReminders } = useNextReminders(
    deadline,
    reminderMinutes,
    refreshTrigger
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
        <Clock className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
        Delivery Settings
      </h3>
      <MessageDeliverySettings 
        condition={condition}
        formatDate={formatDate}
        renderConditionType={renderConditionType}
        showInTabs={true}
      />
      
      {/* Next Reminders Section - Added from ReminderSection */}
      {isArmed && hasReminders && upcomingReminders.length > 0 && (
        <div className="mt-4 pt-2 border-t border-border">
          <div className="grid grid-cols-3 gap-1 text-sm">
            <span className="font-medium">Next reminders:</span>
            <div className="col-span-2 flex flex-wrap gap-1">
              {upcomingReminders.map((reminder, index) => (
                <span 
                  key={index} 
                  className="inline-block px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-xs"
                  title={reminder.formattedText}
                >
                  {reminder.formattedShortDate}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
