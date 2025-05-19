
import React, { useState } from "react";
import { parseReminderMinutes } from "@/utils/reminderUtils";
import { useNextReminders } from "@/hooks/useNextReminders";
import { ReminderHistoryDialog } from "@/components/message/detail/ReminderHistoryDialog";
import { ReminderHeader } from "./reminder/ReminderHeader";
import { ReminderStatus } from "./reminder/ReminderStatus";
import { TestReminderButton } from "./reminder/TestReminderButton";
import { DebugInfo } from "./reminder/DebugInfo";
import { useReminderManager } from "./reminder/hooks/useReminderManager";
import { enhanceReminders } from "./reminder/utils/reminderEnhancer";
import { AlertTriangle, Bell, History, RefreshCw } from "lucide-react";
import { AccordionSection } from "@/components/message/detail/AccordionSection";
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

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
    <div className="mt-1">
      <AccordionSection
        title={
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center">
              <Bell className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION} ${ICON_HOVER_EFFECTS.muted}`} />
              Reminder Information
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-full ${HOVER_TRANSITION}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleForceRefresh();
                }}
                disabled={refreshInProgressRef.current || isLoading}
                title="Refresh reminders"
              >
                <RefreshCw 
                  className={`h-4 w-4 ${refreshInProgressRef.current ? 'animate-spin' : ''} ${HOVER_TRANSITION} ${ICON_HOVER_EFFECTS.muted}`} 
                />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-full ${HOVER_TRANSITION}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setHistoryOpen(true);
                }}
                title="View reminder history"
              >
                <History className={`h-4 w-4 ${HOVER_TRANSITION} ${ICON_HOVER_EFFECTS.muted}`} />
              </Button>
            </div>
          </div>
        }
        defaultOpen={true}
      >
        {/* Display formatted reminders list with consistent text-sm styling */}
        {formattedAllReminders.length > 0 && (
          <div className="mb-1">
            <div className="grid gap-1 text-sm">
              {formattedAllReminders.map((reminder, index) => (
                <div key={index} className={`flex items-start ${reminder.includes("Final Delivery") ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  <span className="mr-2 mt-0.5 flex-shrink-0">•</span>
                  <div className="flex items-center">
                    {reminder.includes("Final Delivery") && (
                      <AlertTriangle className="inline-block h-3.5 w-3.5 mr-1.5" />
                    )}
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
        
        {hasReminders && enhancedReminders.length > 0 && (
          <TestReminderButton
            onTestReminder={handleTestReminder}
            isTestingReminder={isTestingReminder}
            disabled={refreshInProgressRef.current}
          />
        )}
        
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
      </AccordionSection>
      
      {/* Reminder History Dialog */}
      {condition?.message_id && (
        <ReminderHistoryDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          messageId={condition.message_id}
        />
      )}
    </div>
  );
}
