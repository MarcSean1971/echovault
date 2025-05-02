
import { TimeThresholdSelector } from "./TimeThresholdSelector";
import { RecurringPatternSelector } from "./RecurringPatternSelector";
import { ReminderSettings } from "./ReminderSettings";
import { Bell } from "lucide-react";
import { RecurringPattern, TriggerType } from "@/types/message";

interface RegularCheckInWithRecurringProps {
  hoursThreshold: number;
  setHoursThreshold: (hours: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (minutes: number) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  reminderHours: number[];
  setReminderHours: (hours: number[]) => void;
}

export function RegularCheckInWithRecurring({
  hoursThreshold,
  setHoursThreshold,
  minutesThreshold,
  setMinutesThreshold,
  recurringPattern,
  setRecurringPattern,
  reminderHours,
  setReminderHours
}: RegularCheckInWithRecurringProps) {
  return (
    <div className="space-y-6">      
      <TimeThresholdSelector 
        conditionType={'regular_check_in_recurring' as TriggerType}
        hoursThreshold={hoursThreshold}
        setHoursThreshold={setHoursThreshold}
        minutesThreshold={minutesThreshold}
        setMinutesThreshold={setMinutesThreshold}
      />
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium flex items-center mb-4">
          <Bell className="mr-2 h-4 w-4" />
          Recurring Message Schedule
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          After the initial message is sent, it will be repeated according to this schedule until you check in.
        </p>
        
        <RecurringPatternSelector
          pattern={recurringPattern}
          setPattern={setRecurringPattern}
          forceEnabled={true}
        />
      </div>
      
      <ReminderSettings
        reminderHours={reminderHours}
        setReminderHours={setReminderHours}
      />
    </div>
  );
}
