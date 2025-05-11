
import { CustomTimeInput } from "../CustomTimeInput";
import { ReminderSettings } from "../ReminderSettings";
import { NoCheckInDeliveryOptions } from "../NoCheckInDeliveryOptions";
import { DeliveryOption, RecurringPattern } from "@/types/message";

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
  
  const totalThresholdHours = calculateTotalThreshold();
  
  return (
    <div className="space-y-6">
      <CustomTimeInput
        hours={hoursThreshold}
        setHours={setHoursThreshold}
        minutes={minutesThreshold}
        setMinutes={setMinutesThreshold}
        label="Time without check-in before message is sent"
      />
      {/* Pass the total threshold to ReminderSettings */}
      <ReminderSettings
        reminderHours={reminderHours}
        setReminderHours={setReminderHours}
        maxHours={totalThresholdHours}
      />
      {/* Add custom check-in code input - moved to be after ReminderSettings */}
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
