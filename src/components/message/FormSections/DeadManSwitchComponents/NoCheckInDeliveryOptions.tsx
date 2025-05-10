
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { DeliveryOption, RecurringPattern } from "@/types/message";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { RecurringPatternSelector } from "./RecurringPatternSelector";

interface NoCheckInDeliveryOptionsProps {
  deliveryOption: DeliveryOption;
  setDeliveryOption: (option: DeliveryOption) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
}

export function NoCheckInDeliveryOptions({
  deliveryOption,
  setDeliveryOption,
  recurringPattern,
  setRecurringPattern,
  triggerDate,
  setTriggerDate
}: NoCheckInDeliveryOptionsProps) {
  const handleDeliveryOptionChange = (value: string) => {
    setDeliveryOption(value as DeliveryOption);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Delivery Options</Label>
        <RadioGroup 
          value={deliveryOption} 
          onValueChange={handleDeliveryOptionChange}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="once" id="once" />
            <Label htmlFor="once" className="cursor-pointer">
              Send once at specific date/time
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="recurring" id="recurring" />
            <Label htmlFor="recurring" className="cursor-pointer">
              Send on a recurring schedule
            </Label>
          </div>
        </RadioGroup>
      </div>

      {deliveryOption === "once" && (
        <div className="space-y-2 pl-6 mt-4">
          <Label htmlFor="triggerDate">Select date and time</Label>
          <DateTimePicker 
            date={triggerDate} 
            setDate={setTriggerDate}
          />
        </div>
      )}

      {deliveryOption === "recurring" && (
        <div className="space-y-2 pl-6 mt-4">
          <RecurringPatternSelector 
            recurringPattern={recurringPattern} 
            setRecurringPattern={setRecurringPattern}
          />
        </div>
      )}
    </div>
  );
}
