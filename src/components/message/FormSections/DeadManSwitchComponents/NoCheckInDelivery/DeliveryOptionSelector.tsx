
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, Repeat } from "lucide-react";
import { DeliveryOption } from "@/types/message";
import { RadioCardOption } from "../RadioCardOption";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface DeliveryOptionSelectorProps {
  deliveryOption: DeliveryOption;
  setDeliveryOption: (option: DeliveryOption) => void;
}

export function DeliveryOptionSelector({
  deliveryOption,
  setDeliveryOption
}: DeliveryOptionSelectorProps) {
  // Handle option change and log for debugging
  const handleOptionChange = (value: string) => {
    const option = value as DeliveryOption;
    console.log(`Delivery option changed from ${deliveryOption} to ${option}`);
    setDeliveryOption(option);
  };

  return (
    <div>
      <Label className="font-medium">How should the message be delivered?</Label>
      
      <RadioGroup 
        value={deliveryOption} 
        onValueChange={handleOptionChange}
        className="grid grid-cols-1 gap-3 mt-2"
      >
        <RadioCardOption
          value="once"
          id="delivery-once"
          label="Once off"
          description="Send the message only once if you don't check in"
          icon={<Clock className={`h-4 w-4 ${HOVER_TRANSITION}`} />}
          isSelected={deliveryOption === "once"}
        />
        
        <RadioCardOption
          value="recurring"
          id="delivery-recurring"
          label="Regular schedule"
          description="Send the message repeatedly on a schedule if you don't check in"
          icon={<Repeat className={`h-4 w-4 ${HOVER_TRANSITION}`} />}
          isSelected={deliveryOption === "recurring"}
        />
      </RadioGroup>
    </div>
  );
}
