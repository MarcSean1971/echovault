
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
      // If recurring is selected but no pattern exists, create a default
      console.log("Setting default recurring pattern for recurring delivery");
      setRecurringPattern({ type: 'daily', interval: 1 });
    } else if (deliveryOption === "once" && recurringPattern) {
      // If once-off is selected but a pattern exists, clear it
      console.log("Clearing recurring pattern for once-off delivery");
      setRecurringPattern(null);
    }
  }, [deliveryOption, recurringPattern, setRecurringPattern]);
  
  // Handle delivery option change
  const handleDeliveryOptionChange = (option: DeliveryOption) => {
    setDeliveryOption(option);
    
    // Immediately update the recurring pattern based on the selection
    if (option === "once") {
      console.log("Setting recurring pattern to null for once-off");
      setRecurringPattern(null);
    } else if (option === "recurring" && !recurringPattern) {
      console.log("Creating default recurring pattern for recurring");
      setRecurringPattern({ type: 'daily', interval: 1 });
    }
  };
  
  return (
    <div className="space-y-6 mt-4">
      <DeliveryOptionSelector 
        deliveryOption={deliveryOption} 
        setDeliveryOption={handleDeliveryOptionChange}
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
