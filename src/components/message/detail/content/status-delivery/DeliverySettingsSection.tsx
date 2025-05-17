
import React, { useState, useEffect } from "react";
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
  // Local refresh counter to force updates when needed
  const [localRefresh, setLocalRefresh] = useState(0);
  
  // Listen for condition updates to refresh scheduled reminders
  useEffect(() => {
    const handleConditionUpdated = (event: Event) => {
      if (event instanceof CustomEvent && condition) {
        // Check if this update is relevant to this condition
        if (
          (event.detail?.messageId === condition.message_id) || 
          (event.detail?.conditionId === condition.id)
        ) {
          console.log('[DeliverySettingsSection] Received condition update event, refreshing scheduled reminders');
          // Update localRefresh to trigger a re-fetch
          setLocalRefresh(prev => prev + 1);
        }
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionUpdated);
    };
  }, [condition]);
  
  // Combine external and local refresh triggers
  const combinedRefreshTrigger = refreshTrigger ? refreshTrigger + localRefresh : localRefresh;

  if (!condition) {
    return null;
  }

  // Use the scheduled reminders hook to get information about all scheduled reminders
  const {
    isLoading,
    upcomingReminders: formattedAllReminders,
    hasSchedule
  } = useScheduledReminders(condition.message_id, combinedRefreshTrigger);

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
      {!isLoading && (
        <div className="bg-muted/30 rounded-md p-3 text-sm mt-2">
          <h4 className="font-medium mb-1 flex items-center justify-between">
            <span>Scheduled Events</span>
            {isArmed && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>}
            {!isArmed && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Inactive</Badge>}
          </h4>
          
          {formattedAllReminders.length > 0 ? (
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
          ) : (
            <p className="text-muted-foreground italic">
              {isArmed ? 
                "No scheduled reminders found. They may have been already sent or not configured." :
                "Message is not armed. Reminders will be scheduled when the message is armed."
              }
            </p>
          )}
          
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
