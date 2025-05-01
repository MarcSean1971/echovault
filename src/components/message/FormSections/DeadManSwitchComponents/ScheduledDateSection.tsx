
import { DatePicker } from "./DatePicker";
import { RecurringPatternSelector } from "./RecurringPatternSelector";
import { RecurringPattern } from "@/types/message";

interface ScheduledDateSectionProps {
  triggerDate: Date | undefined;
  setTriggerDate: (date: Date | undefined) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
}

export function ScheduledDateSection({
  triggerDate,
  setTriggerDate,
  recurringPattern,
  setRecurringPattern
}: ScheduledDateSectionProps) {
  return (
    <div className="space-y-4">
      <DatePicker
        selectedDate={triggerDate}
        setSelectedDate={setTriggerDate}
        label="Select Delivery Date & Time"
      />
      
      <RecurringPatternSelector
        pattern={recurringPattern}
        setPattern={setRecurringPattern}
      />
    </div>
  );
}
