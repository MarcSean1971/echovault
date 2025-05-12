
import { InactivityToRecurring } from "../InactivityToRecurring";
import { RecurringPattern } from "@/types/message";

interface InactivityToRecurringConditionProps {
  hoursThreshold: number;
  setHoursThreshold: (hours: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (minutes: number) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  reminderHours: number[];
  setReminderHours: (hours: number[]) => void;
}

export function InactivityToRecurringCondition({
  hoursThreshold,
  setHoursThreshold,
  minutesThreshold,
  setMinutesThreshold,
  recurringPattern,
  setRecurringPattern,
  reminderHours,
  setReminderHours
}: InactivityToRecurringConditionProps) {
  return (
    <InactivityToRecurring
      hoursThreshold={hoursThreshold}
      setHoursThreshold={setHoursThreshold}
      minutesThreshold={minutesThreshold}
      setMinutesThreshold={setMinutesThreshold}
      recurringPattern={recurringPattern}
      setRecurringPattern={setRecurringPattern}
      reminderHours={reminderHours}
      setReminderHours={setReminderHours}
    />
  );
}
