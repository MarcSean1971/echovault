
import { DeliveryOption, RecurringPattern } from "@/types/message";

export interface NoCheckInDeliveryOptionsProps {
  deliveryOption: DeliveryOption;
  setDeliveryOption: (option: DeliveryOption) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
}
