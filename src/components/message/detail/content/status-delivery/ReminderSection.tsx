
import React from "react";
import { Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { parseReminderMinutes } from "@/utils/reminderUtils";
import { useNextReminders } from "@/hooks/useNextReminders";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

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
  // Parse reminder minutes from the condition
  const reminderMinutes = parseReminderMinutes(condition?.reminder_hours);
  
  // Get upcoming reminder information
  const { upcomingReminders, hasReminders } = useNextReminders(
    deadline,
    reminderMinutes,
    refreshTrigger
  );
  
  if (!isArmed) {
    return null;
  }

  return (
    <>
      <Separator className="my-3" />
      <h3 className="text-sm font-medium text-muted-foreground mb-3 mt-3 flex items-center">
        <Bell className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
        Reminder Information
      </h3>
      <div className="space-y-3 text-sm">
        {hasReminders ? (
          <>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-medium">Status:</span>
              <span className="col-span-2">
                {upcomingReminders.length > 0 
                  ? `${upcomingReminders.length} upcoming reminder${upcomingReminders.length !== 1 ? 's' : ''}` 
                  : "All reminders sent"}
              </span>
            </div>
            {upcomingReminders.length > 0 && (
              <div className="grid grid-cols-3 gap-1">
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
            )}
          </>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            <span className="font-medium">Status:</span>
            <span className="col-span-2 text-muted-foreground italic">No reminders configured</span>
          </div>
        )}
      </div>
    </>
  );
}
