
import { InactivityToDate } from "../InactivityToDate";
import { RecurringPattern } from "@/types/message";

interface InactivityToDateConditionProps {
  hoursThreshold: number;
  setHoursThreshold: (hours: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (minutes: number) => void;
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  reminderMinutes: number[];
  setReminderMinutes: (minutes: number[]) => void;
}

export function InactivityToDateCondition({
  hoursThreshold,
  setHoursThreshold,
  minutesThreshold,
  setMinutesThreshold,
  triggerDate,
  setTriggerDate,
  recurringPattern,
  setRecurringPattern,
  reminderMinutes,
  setReminderMinutes
}: InactivityToDateConditionProps) {
  return (
    <InactivityToDate
      hoursThreshold={hoursThreshold}
      setHoursThreshold={setHoursThreshold}
      minutesThreshold={minutesThreshold}
      setMinutesThreshold={setMinutesThreshold}
      triggerDate={triggerDate}
      setTriggerDate={setTriggerDate}
      recurringPattern={recurringPattern}
      setRecurringPattern={setRecurringPattern}
      reminderMinutes={reminderMinutes}
      setReminderMinutes={setReminderMinutes}
    />
  );
}
