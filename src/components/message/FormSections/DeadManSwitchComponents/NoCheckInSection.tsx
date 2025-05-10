
import { useState } from "react";
import { TimeThresholdSelector } from "./TimeThresholdSelector";
import { ReminderSettings } from "./ReminderSettings";
import { RecurringPattern, DeliveryOption } from "@/types/message";
import { NoCheckInDeliveryOptions } from "./NoCheckInDeliveryOptions";

interface NoCheckInSectionProps {
  hoursThreshold: number;
  setHoursThreshold: (value: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (value: number) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  triggerDate: Date | undefined;
  setTriggerDate: (date: Date | undefined) => void;
  reminderHours: number[];
  setReminderHours: (value: number[]) => void;
}

export function NoCheckInSection({
  hoursThreshold,
  setHoursThreshold,
  minutesThreshold,
  setMinutesThreshold,
  recurringPattern,
  setRecurringPattern,
  triggerDate,
  setTriggerDate,
  reminderHours,
  setReminderHours
}: NoCheckInSectionProps) {
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("once");
  
  return (
    <div className="space-y-6">
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
        maxHours={hoursThreshold}
      />
      
      <NoCheckInDeliveryOptions
        deliveryOption={deliveryOption}
        setDeliveryOption={setDeliveryOption}
        recurringPattern={recurringPattern}
        setRecurringPattern={setRecurringPattern}
        triggerDate={triggerDate ? triggerDate : null}
        setTriggerDate={(date) => setTriggerDate(date || undefined)}
      />
    </div>
  );
}
