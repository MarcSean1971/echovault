
import React from "react";
import { Clock } from "lucide-react";
import { MessageDeliverySettings } from "../../MessageDeliverySettings";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
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

  // Use the updated next reminders hook to get all scheduled reminders
  const {
    loading,
    nextReminder,
    formattedNextReminder,
    formattedAllReminders
  } = useNextReminders(condition.message_id, refreshTrigger);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
        <Clock className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION} ${ICON_HOVER_EFFECTS.muted}`} />
        Delivery Settings
      </h3>
      
      <MessageDeliverySettings 
        condition={condition}
        formatDate={formatDate}
        renderConditionType={renderConditionType}
        showInTabs={true}
      />
      
      {/* Add scheduled reminders display */}
      {!loading && formattedAllReminders.length > 0 && (
        <div className="bg-muted/30 rounded-md p-3 text-sm mt-2">
          <h4 className="font-medium mb-1">Scheduled Reminders</h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            {formattedAllReminders.map((reminder, index) => (
              <li key={index}>{reminder}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
