
import { CustomTimeInput } from "../CustomTimeInput";
import { NoCheckInDeliveryOptions } from "../NoCheckInDeliveryOptions";
import { DeliveryOption, RecurringPattern } from "@/types/message";
import { ReminderSettings } from "../ReminderSettings";

interface NoCheckInConditionProps {
  hoursThreshold: number;
  setHoursThreshold: (hours: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (minutes: number) => void;
  deliveryOption: DeliveryOption;
  setDeliveryOption: (option: DeliveryOption) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
  reminderHours: number[];
  setReminderHours: (hours: number[]) => void;
  renderCustomCheckInCode: () => React.ReactNode;
}

export function NoCheckInCondition({
  hoursThreshold,
  setHoursThreshold,
  minutesThreshold,
  setMinutesThreshold,
  deliveryOption,
  setDeliveryOption,
  recurringPattern,
  setRecurringPattern,
  triggerDate,
  setTriggerDate,
  reminderHours,
  setReminderHours,
  renderCustomCheckInCode
}: NoCheckInConditionProps) {
  // Calculate the total threshold in decimal hours for no_check_in
  const calculateTotalThreshold = (): number => {
    return hoursThreshold + (minutesThreshold / 60);
  };
  
  // Calculate the maximum hours for reminders based on the threshold
  // This ensures reminders are only set within the check-in window
  const maxReminderHours = hoursThreshold + (minutesThreshold / 60);
  
  return (
    <div className="space-y-6">
      <CustomTimeInput
        hours={hoursThreshold}
        setHours={setHoursThreshold}
        minutes={minutesThreshold}
        setMinutes={setMinutesThreshold}
        label="Time without check-in before message is sent"
      />
      
      {/* Reminder Settings */}
      <ReminderSettings
        reminderHours={reminderHours}
        setReminderHours={setReminderHours}
        maxHours={maxReminderHours}
      />
      
      {/* Custom check-in code input */}
      {renderCustomCheckInCode()}
      
      <NoCheckInDeliveryOptions
        deliveryOption={deliveryOption}
        setDeliveryOption={setDeliveryOption}
        recurringPattern={recurringPattern}
        setRecurringPattern={setRecurringPattern}
        triggerDate={triggerDate}
        setTriggerDate={setTriggerDate}
      />
    </div>
  );
}
