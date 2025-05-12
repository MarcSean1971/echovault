
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
  reminderMinutes: number[];
  setReminderMinutes: (minutes: number[]) => void;
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
  reminderMinutes,
  setReminderMinutes,
  renderCustomCheckInCode
}: NoCheckInConditionProps) {
  // Calculate the total threshold in minutes for no_check_in
  const calculateTotalMinutes = (): number => {
    return (hoursThreshold * 60) + minutesThreshold;
  };
  
  // Calculate the maximum minutes for reminders based on the threshold
  // This ensures reminders are only set within the check-in window
  const maxReminderMinutes = calculateTotalMinutes();
  
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
        reminderMinutes={reminderMinutes}
        setReminderMinutes={setReminderMinutes}
        maxMinutes={maxReminderMinutes}
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
