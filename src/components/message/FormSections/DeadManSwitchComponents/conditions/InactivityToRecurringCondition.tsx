
import { InactivityToRecurring } from "../InactivityToRecurring";
import { RecurringPattern } from "@/types/message";

interface InactivityToRecurringConditionProps {
  hoursThreshold: number;
  setHoursThreshold: (hours: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (minutes: number) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  reminderMinutes: number[];
  setReminderMinutes: (minutes: number[]) => void;
}

export function InactivityToRecurringCondition({
  hoursThreshold,
  setHoursThreshold,
  minutesThreshold,
  setMinutesThreshold,
  recurringPattern,
  setRecurringPattern,
  reminderMinutes,
  setReminderMinutes
}: InactivityToRecurringConditionProps) {
  return (
    <InactivityToRecurring
      hoursThreshold={hoursThreshold}
      setHoursThreshold={setHoursThreshold}
      minutesThreshold={minutesThreshold}
      setMinutesThreshold={setMinutesThreshold}
      recurringPattern={recurringPattern}
      setRecurringPattern={setRecurringPattern}
      reminderMinutes={reminderMinutes}
      setReminderMinutes={setReminderMinutes}
    />
  );
}
