
import { TimeThresholdSelector } from "./TimeThresholdSelector";
import { DatePicker } from "./DatePicker";
import { RecurringPatternSelector } from "./RecurringPatternSelector";
import { RecurringPattern } from "@/types/message";
import { Separator } from "@/components/ui/separator";
import { ReminderSettings } from "./ReminderSettings";

interface InactivityToDateProps {
  hoursThreshold: number;
  setHoursThreshold: (value: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (value: number) => void;
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  reminderHours: number[];
  setReminderHours: (value: number[]) => void;
}

export function InactivityToDate({
  hoursThreshold,
  setHoursThreshold,
  minutesThreshold,
  setMinutesThreshold,
  triggerDate,
  setTriggerDate,
  recurringPattern,
  setRecurringPattern,
  reminderHours,
  setReminderHours
}: InactivityToDateProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">First Phase: Inactivity Detection</h3>
        <TimeThresholdSelector
          conditionType="no_check_in"
          hoursThreshold={hoursThreshold}
          setHoursThreshold={setHoursThreshold}
          minutesThreshold={minutesThreshold}
          setMinutesThreshold={setMinutesThreshold}
        />
        
        {/* Restore reminder settings */}
        <ReminderSettings
          reminderHours={reminderHours}
          setReminderHours={setReminderHours}
          maxHours={hoursThreshold + (minutesThreshold / 60)}
        />
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="font-medium">Second Phase: Scheduled Delivery</h3>
        <p className="text-sm text-muted-foreground">
          After inactivity is detected, the message will be scheduled for this specific date:
        </p>
        
        <DatePicker
          date={triggerDate}
          setDate={setTriggerDate}
          label="Select delivery date and time"
        />
        
        <RecurringPatternSelector
          pattern={recurringPattern}
          setPattern={setRecurringPattern}
          forceEnabled={false}
        />
      </div>
    </div>
  );
}
