
import { InactivityToRecurring } from "../InactivityToRecurring";
import { RecurringPattern } from "@/types/message";

interface InactivityToRecurringConditionProps {
  hoursThreshold: number;
  setHoursThreshold: (hours: number) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  reminderHours: number[];
  setReminderHours: (hours: number[]) => void;
}

export function InactivityToRecurringCondition({
  hoursThreshold,
  setHoursThreshold,
  recurringPattern,
  setRecurringPattern,
  reminderHours,
  setReminderHours
}: InactivityToRecurringConditionProps) {
  return (
    <InactivityToRecurring
      hoursThreshold={hoursThreshold}
      setHoursThreshold={setHoursThreshold}
      recurringPattern={recurringPattern}
      setRecurringPattern={setRecurringPattern}
      reminderHours={reminderHours}
      setReminderHours={setReminderHours}
    />
  );
}
