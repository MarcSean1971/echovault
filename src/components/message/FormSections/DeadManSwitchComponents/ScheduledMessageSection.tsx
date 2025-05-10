
import { RecurringPattern } from "@/types/message";
import { ScheduledDateSection } from "./ScheduledDateSection";

interface ScheduledMessageSectionProps {
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
}

export function ScheduledMessageSection({
  triggerDate,
  setTriggerDate,
  recurringPattern,
  setRecurringPattern
}: ScheduledMessageSectionProps) {
  return (
    <div className="space-y-4">
      <ScheduledDateSection 
        triggerDate={triggerDate || undefined}
        setTriggerDate={(date) => setTriggerDate(date || null)}
        recurringPattern={recurringPattern}
        setRecurringPattern={setRecurringPattern}
      />
      
      <p className="text-sm text-muted-foreground">
        This message will be delivered at the date and time you select.
        {recurringPattern ? " It will also repeat according to your chosen pattern." : ""}
      </p>
    </div>
  );
}
