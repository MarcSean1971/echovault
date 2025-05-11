
import { DatePicker } from "./DatePicker";
import { RecurringPatternSelector } from "./RecurringPatternSelector";
import { RecurringPattern } from "./recurring-pattern/RecurringPatternType";

interface ScheduledDateSectionProps {
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
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
        label="Earliest Delivery Date & Time"
      />
      
      <RecurringPatternSelector
        pattern={recurringPattern}
        setPattern={setRecurringPattern}
      />
    </div>
  );
}
