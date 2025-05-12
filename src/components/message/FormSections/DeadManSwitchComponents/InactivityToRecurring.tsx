
import { TimeThresholdSelector } from "./TimeThresholdSelector";
import { RecurringPatternSelector } from "./RecurringPatternSelector";
import { RecurringPattern } from "@/types/message";
import { Separator } from "@/components/ui/separator";

interface InactivityToRecurringProps {
  hoursThreshold: number;
  setHoursThreshold: (value: number) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  reminderHours: number[];
  setReminderHours: (value: number[]) => void;
}

export function InactivityToRecurring({
  hoursThreshold,
  setHoursThreshold,
  recurringPattern,
  setRecurringPattern,
  reminderHours,
  setReminderHours
}: InactivityToRecurringProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">First Phase: Inactivity Detection</h3>
        <TimeThresholdSelector
          conditionType="no_check_in"
          hoursThreshold={hoursThreshold}
          setHoursThreshold={setHoursThreshold}
        />
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="font-medium">Second Phase: Recurring Delivery</h3>
        <p className="text-sm text-muted-foreground">
          After the inactivity period, the message will be sent repeatedly on this schedule:
        </p>
        
        <RecurringPatternSelector
          pattern={recurringPattern}
          setPattern={setRecurringPattern}
          forceEnabled={true}
        />
      </div>
    </div>
  );
}
