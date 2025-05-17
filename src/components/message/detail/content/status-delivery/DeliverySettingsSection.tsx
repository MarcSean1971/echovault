
import React from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { MessageDeliverySettings } from "../../MessageDeliverySettings";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { useScheduledReminders } from "@/hooks/useScheduledReminders";
import { parseReminderMinutes } from "@/utils/reminderUtils";
import { Badge } from "@/components/ui/badge";

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

  // Use the scheduled reminders hook to get information about all scheduled reminders
  const {
    isLoading,
    upcomingReminders: formattedAllReminders,
    hasSchedule
  } = useScheduledReminders(condition.message_id, refreshTrigger);

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
      {!isLoading && formattedAllReminders.length > 0 && (
        <div className="bg-muted/30 rounded-md p-3 text-sm mt-2">
          <h4 className="font-medium mb-1 flex items-center justify-between">
            <span>Scheduled Events</span>
            {isArmed && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>}
            {!isArmed && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Inactive</Badge>}
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            {formattedAllReminders.map((reminder, index) => (
              <li key={index} className={reminder.includes("Final Delivery") ? "font-medium text-destructive" : ""}>
                {reminder.includes("Final Delivery") && (
                  <AlertTriangle className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />
                )}
                {reminder}
              </li>
            ))}
          </ul>
          
          {/* Info text about unified scheduling system */}
          <p className="text-xs text-muted-foreground mt-3 italic">
            All reminders and final delivery are scheduled through our reliable delivery system
            with multiple fallbacks for critical messages.
          </p>
        </div>
      )}
    </div>
  );
}
