
import { Label } from "@/components/ui/label";
import { RecurringPattern } from "@/types/message";
import { RecurringPatternSelector } from "../RecurringPatternSelector";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface RecurringScheduleSectionProps {
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
}

export function RecurringScheduleSection({
  recurringPattern,
  setRecurringPattern,
  triggerDate,
  setTriggerDate
}: RecurringScheduleSectionProps) {
  return (
    <div className="mt-6 border-t pt-4">
      <Label className="font-medium mb-3 block">Regular Schedule Options</Label>
      <RecurringPatternSelector
        pattern={recurringPattern}
        setPattern={setRecurringPattern}
        forceEnabled={true}
      />
    </div>
  );
}
