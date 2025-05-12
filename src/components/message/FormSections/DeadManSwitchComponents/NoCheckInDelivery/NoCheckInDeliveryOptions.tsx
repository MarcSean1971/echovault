
import { DeliveryOption, RecurringPattern } from "@/types/message";
import { DeliveryOptionSelector } from "./DeliveryOptionSelector";
import { EarliestDeliverySection } from "./EarliestDeliverySection";
import { RecurringScheduleSection } from "./RecurringScheduleSection";
import { NoCheckInDeliveryOptionsProps } from "./types";

export function NoCheckInDeliveryOptions({
  deliveryOption,
  setDeliveryOption,
  recurringPattern,
  setRecurringPattern,
  triggerDate,
  setTriggerDate
}: NoCheckInDeliveryOptionsProps) {
  return (
    <div className="space-y-6 mt-4">
      <DeliveryOptionSelector 
        deliveryOption={deliveryOption} 
        setDeliveryOption={setDeliveryOption}
      />

      {/* Earliest Possible Delivery section now appears first for both options */}
      <EarliestDeliverySection 
        triggerDate={triggerDate}
        setTriggerDate={setTriggerDate}
      />

      {/* Regular Schedule Options now appears second when recurring is selected */}
      {deliveryOption === "recurring" && (
        <RecurringScheduleSection 
          recurringPattern={recurringPattern}
          setRecurringPattern={setRecurringPattern}
        />
      )}
    </div>
  );
}
