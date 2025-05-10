
import { useState, useEffect } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RecurringPattern, DeliveryOption } from "@/types/message";
import { RecurringPatternSelector } from "./RecurringPatternSelector";
import { DateTimePicker } from "@/components/ui/date-time-picker";

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
  // Safe type cast for deliveryOption
  const handleDeliveryOptionChange = (value: string) => {
    setDeliveryOption(value as DeliveryOption);
  };
  
  return (
    <div className="space-y-4">
      <div>
        <Label>Delivery Options</Label>
        <RadioGroup 
          defaultValue={deliveryOption} 
          value={deliveryOption}
          onValueChange={handleDeliveryOptionChange}
          className="mt-2 space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="once" id="once" />
            <Label htmlFor="once" className="cursor-pointer">
              Once (immediately deliver message)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="recurring" id="recurring" />
            <Label htmlFor="recurring" className="cursor-pointer">
              Recurring (deliver message regularly)
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      {deliveryOption === "once" && (
        <div className="p-4 border rounded-md bg-muted/30">
          <Label>Trigger Date</Label>
          <div className="mt-2">
            <DateTimePicker
              date={triggerDate || undefined}
              setDate={(date) => setTriggerDate(date || null)}
              granularity="minute"
              hideTimeZone
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Message will be sent once on this date if no check-in is detected.
          </p>
        </div>
      )}
      
      {deliveryOption === "recurring" && (
        <div className="p-4 border rounded-md bg-muted/30">
          <RecurringPatternSelector
            recurringPattern={recurringPattern}
            setRecurringPattern={setRecurringPattern}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Message will be sent on a recurring schedule if no check-in is detected.
          </p>
        </div>
      )}
    </div>
  );
}
