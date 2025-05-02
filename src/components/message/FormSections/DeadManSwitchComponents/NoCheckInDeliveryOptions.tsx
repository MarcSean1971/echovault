
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, Repeat } from "lucide-react";
import { DeliveryOption, RecurringPattern } from "@/types/message";
import { RadioCardOption } from "./RadioCardOption";
import { RecurringPatternSelector } from "./RecurringPatternSelector";
import { Separator } from "@/components/ui/separator";

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
  return (
    <div className="space-y-6 mt-4">
      <div>
        <Label className="font-medium">How should the message be delivered?</Label>
        
        <RadioGroup 
          value={deliveryOption} 
          onValueChange={(value) => setDeliveryOption(value as DeliveryOption)}
          className="grid grid-cols-1 gap-3 mt-2"
        >
          <RadioCardOption
            value="once"
            id="delivery-once"
            label="Once off"
            description="Send the message only once if you don't check in"
            icon={<Clock className="h-4 w-4" />}
            isSelected={deliveryOption === "once"}
          />
          
          <RadioCardOption
            value="recurring"
            id="delivery-recurring"
            label="Regular schedule"
            description="Send the message repeatedly on a schedule if you don't check in"
            icon={<Repeat className="h-4 w-4" />}
            isSelected={deliveryOption === "recurring"}
          />
        </RadioGroup>
      </div>

      {deliveryOption === "recurring" && (
        <div className="mt-6 border-t pt-4">
          <Label className="font-medium mb-3 block">Regular Schedule Options</Label>
          <RecurringPatternSelector
            pattern={recurringPattern}
            setPattern={setRecurringPattern}
            forceEnabled={true}
          />
        </div>
      )}
    </div>
  );
}
