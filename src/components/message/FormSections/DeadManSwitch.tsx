
import { useMessageForm } from "../MessageFormContext";
import { useAuth } from "@/contexts/AuthContext";

export function DeadManSwitch() {
  // Access all required properties to satisfy TypeScript, but don't use them
  const {
    enableDeadManSwitch,
    setEnableDeadManSwitch,
    conditionType,
    setConditionType,
    hoursThreshold,
    setHoursThreshold,
    minutesThreshold,
    setMinutesThreshold,
    selectedRecipients,
    setSelectedRecipients,
    triggerDate,
    setTriggerDate,
    recurringPattern,
    setRecurringPattern,
    panicTriggerConfig,
    setPanicTriggerConfig,
    pinCode,
    setPinCode,
    unlockDelay,
    setUnlockDelay,
    expiryHours,
    setExpiryHours,
    deliveryOption,
    setDeliveryOption,
    reminderHours,
    setReminderHours
  } = useMessageForm();
  
  const { userId } = useAuth();

  // Return null so the component doesn't render anything
  return null;
}
