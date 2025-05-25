
import React, { useState } from "react";
import { ReminderHistoryDialog } from "@/components/message/detail/ReminderHistoryDialog";
import { ReminderStatus } from "./reminder/ReminderStatus";
import { useSimpleReminders } from "@/hooks/useSimpleReminders";
import { Bell } from "lucide-react";
import { AccordionSection } from "@/components/message/detail/AccordionSection";
import { ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface ReminderSectionProps {
  condition: any | null;
  deadline: Date | null;
  isArmed: boolean;
  refreshTrigger?: number;
}

export function ReminderSection({ 
  condition, 
  deadline, 
  isArmed,
  refreshTrigger
}: ReminderSectionProps) {
  // State for history dialog
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  
  // SIMPLIFIED: Use the simple reminders hook
  const { 
    upcomingReminders, 
    hasReminders, 
    isLoading, 
    error 
  } = useSimpleReminders(condition?.message_id, refreshTrigger);
  
  console.log("[ReminderSection] SIMPLIFIED rendering with:", {
    upcomingReminders,
    hasReminders,
    isLoading,
    messageId: condition?.message_id,
    isArmed
  });
  
  // Don't show anything if not armed
  if (!isArmed) {
    return null;
  }

  return (
    <AccordionSection
      title={
        <div className="flex items-center">
          <Bell className={`h-4 w-4 mr-1.5 ${ICON_HOVER_EFFECTS.muted}`} />
          Reminder Information {hasReminders && `(${upcomingReminders.length})`}
        </div>
      }
      defaultOpen={true}
      value="reminders"
    >
      {/* SIMPLIFIED: Display reminders list */}
      {upcomingReminders.length > 0 && (
        <div className="mb-2">
          <div className="grid gap-1 text-sm">
            {upcomingReminders.map((reminder, index) => (
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
      
      {/* SIMPLIFIED: Status display */}
      <ReminderStatus
        isLoading={isLoading}
        permissionError={!!error}
        hasReminders={hasReminders}
        enhancedReminders={upcomingReminders.map(text => ({ 
          formattedShortDate: "",
          formattedText: text,
          isImportant: text.includes("Final Delivery"),
          original: text
        }))}
        refreshCount={0}
        errorState={error}
      />
      
      {/* Reminder History Dialog */}
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
