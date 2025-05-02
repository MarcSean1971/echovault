
import { TimeThresholdSelector } from "./TimeThresholdSelector";
import { DatePicker } from "./DatePicker";
import { RecurringPatternSelector } from "./RecurringPatternSelector";
import { ReminderSettings } from "./ReminderSettings";
import { RecurringPattern } from "@/types/message";
import { Separator } from "@/components/ui/separator";
import { CustomTimeInput } from "./CustomTimeInput";

interface InactivityToDateProps {
  hoursThreshold: number;
  setHoursThreshold: (value: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (value: number) => void;
  triggerDate: Date | undefined;
  setTriggerDate: (date: Date | undefined) => void;
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
  // Calculate total hours for max reminder setting
  const totalHoursThreshold = hoursThreshold + (minutesThreshold / 60);
  
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
        
        <ReminderSettings
          reminderHours={reminderHours}
          setReminderHours={setReminderHours}
          maxHours={totalHoursThreshold}
        />
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="font-medium">Second Phase: Specific Date Delivery</h3>
        <p className="text-sm text-muted-foreground">
          After the inactivity period, the message will be sent on this specific date:
        </p>
        
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
    </div>
  );
}
