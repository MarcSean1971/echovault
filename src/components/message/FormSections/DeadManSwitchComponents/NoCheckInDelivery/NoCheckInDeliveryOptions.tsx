
import { DeliveryOption, RecurringPattern } from "@/types/message";
import { DeliveryOptionSelector } from "./DeliveryOptionSelector";
import { EarliestDeliverySection } from "./EarliestDeliverySection";
import { RecurringScheduleSection } from "./RecurringScheduleSection";
import { NoCheckInDeliveryOptionsProps } from "./types";
import { useEffect } from "react";

export function NoCheckInDeliveryOptions({
  deliveryOption,
  setDeliveryOption,
  recurringPattern,
  setRecurringPattern,
  triggerDate,
  setTriggerDate
}: NoCheckInDeliveryOptionsProps) {
  // Ensure that if recurring is selected, we have a default pattern
  useEffect(() => {
    if (deliveryOption === "recurring" && !recurringPattern) {
      setRecurringPattern({ type: 'daily', interval: 1 });
    }
  }, [deliveryOption, recurringPattern, setRecurringPattern]);
  
  return (
    <div className="space-y-6 mt-4">
      <DeliveryOptionSelector 
        deliveryOption={deliveryOption} 
        setDeliveryOption={setDeliveryOption}
      />

      {/* Show earliest delivery section only for once-off delivery */}
      {deliveryOption === "once" && (
        <EarliestDeliverySection 
          triggerDate={triggerDate}
          setTriggerDate={setTriggerDate}
        />
      )}

      {/* Show recurring schedule options when recurring is selected */}
      {deliveryOption === "recurring" && (
        <RecurringScheduleSection 
          recurringPattern={recurringPattern}
          setRecurringPattern={setRecurringPattern}
          triggerDate={triggerDate}
          setTriggerDate={setTriggerDate}
        />
      )}
    </div>
  );
}
