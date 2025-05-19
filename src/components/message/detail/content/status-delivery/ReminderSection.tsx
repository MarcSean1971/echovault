
import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { parseReminderMinutes } from "@/utils/reminderUtils";
import { useNextReminders } from "@/hooks/useNextReminders";
import { ReminderHistoryDialog } from "@/components/message/detail/ReminderHistoryDialog";
import { ReminderHeader } from "./reminder/ReminderHeader";
import { ReminderStatus } from "./reminder/ReminderStatus";
import { ReminderConfigTimes } from "./reminder/ReminderConfigTimes";
import { TestReminderButton } from "./reminder/TestReminderButton";
import { DebugInfo } from "./reminder/DebugInfo";
import { useReminderManager } from "./reminder/hooks/useReminderManager";
import { enhanceReminders } from "./reminder/utils/reminderEnhancer";
import { AlertTriangle } from "lucide-react";

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
    <>
      <Separator className="mb-3" />
      
      <ReminderHeader
        onRefresh={handleForceRefresh}
        onHistoryClick={() => setHistoryOpen(true)}
        isLoading={isLoading}
        refreshInProgress={refreshInProgressRef.current}
      />
      
      {/* Display formatted reminders list moved from DeliverySettingsSection */}
      {formattedAllReminders.length > 0 && (
        <div className="mb-3">
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
      
      {hasReminders && enhancedReminders.length > 0 && (
        <TestReminderButton
          onTestReminder={handleTestReminder}
          isTestingReminder={isTestingReminder}
          disabled={refreshInProgressRef.current}
        />
      )}
      
      {/* Show configured reminder times */}
      <ReminderConfigTimes reminderMinutes={reminderMinutes} />
      
      {/* Show debug info in dev environment */}
      <DebugInfo
        isVisible={process.env.NODE_ENV === 'development'}
        messageId={condition?.message_id}
        conditionId={condition?.id}
        lastRefreshed={lastRefreshed || 0}
        refreshCount={refreshCount}
        reminderMinutes={reminderMinutes}
        permissionError={permissionError}
      />
      
      {/* Reminder History Dialog */}
      {condition?.message_id && (
        <ReminderHistoryDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          messageId={condition.message_id}
        />
      )}
    </>
  );
}
