
import React, { useState } from "react";
import { parseReminderMinutes } from "@/utils/reminderUtils";
import { useNextReminders } from "@/hooks/useNextReminders";
import { ReminderHistoryDialog } from "@/components/message/detail/ReminderHistoryDialog";
import { ReminderStatus } from "./reminder/ReminderStatus";
import { useReminderManager } from "./reminder/hooks/useReminderManager";
import { enhanceReminders } from "./reminder/utils/reminderEnhancer";
import { Bell } from "lucide-react";
import { AccordionSection } from "@/components/message/detail/AccordionSection";
import { ICON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

interface ReminderSectionProps {
  condition: any | null;
  deadline: Date | null;
  isArmed: boolean;
  refreshTrigger?: number;
  formattedAllReminders?: string[];
}

export function ReminderSection({ 
  condition, 
  deadline, 
  isArmed,
  refreshTrigger,
  formattedAllReminders = []
}: ReminderSectionProps) {
  // Parse reminder minutes from the condition
  const reminderMinutes = parseReminderMinutes(condition?.reminder_hours);
  
  // State for history dialog
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  
  // Use the reminder manager hook to handle refresh logic and testing
  const {
    lastForceRefresh,
    refreshCount,
    isTestingReminder,
    errorState,
    refreshInProgressRef,
    setErrorState,
    handleForceRefresh,
    handleTestReminder
  } = useReminderManager({
    messageId: condition?.message_id,
    refreshTrigger
  });
  
  // Get upcoming reminder information with ability to force refresh
  const { 
    upcomingReminders, 
    hasReminders, 
    isLoading, 
    forceRefresh, 
    lastRefreshed, 
    permissionError 
  } = useNextReminders(
    condition?.message_id,
    refreshTrigger || lastForceRefresh
  );
  
  // Transform string reminders to enhanced objects with required properties
  const enhancedReminders = enhanceReminders(upcomingReminders);
  
  // Don't show anything if not armed
  if (!isArmed) {
    return null;
  }

  return (
    <AccordionSection
      title={
        <div className="flex items-center">
          <Bell className={`h-4 w-4 mr-1.5 ${ICON_HOVER_EFFECTS.muted}`} />
          Reminder Information
        </div>
      }
      defaultOpen={true} // CRITICAL FIX: Open by default so user sees the test button
    >
      {/* Display formatted reminders list with consistent text-sm styling */}
      {formattedAllReminders.length > 0 && (
        <div className="mb-2">
          <div className="grid gap-1 text-sm">
            {formattedAllReminders.map((reminder, index) => (
              <div key={index} className={`flex items-start ${reminder.includes("Final Delivery") ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                <span className="mr-2 mt-0.5 flex-shrink-0">•</span>
                <div className="flex items-center">
                  {reminder}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <ReminderStatus
        isLoading={isLoading}
        permissionError={permissionError}
        hasReminders={hasReminders}
        enhancedReminders={enhancedReminders}
        refreshCount={refreshCount}
        errorState={errorState}
      />
      
      {/* Reminder History Dialog - hidden but kept for functionality */}
      {condition?.message_id && (
        <ReminderHistoryDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          messageId={condition.message_id}
        />
      )}
    </AccordionSection>
  );
}
