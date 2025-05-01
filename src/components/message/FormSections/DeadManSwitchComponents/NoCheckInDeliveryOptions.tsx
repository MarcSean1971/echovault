
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Repeat } from "lucide-react";

type DeliveryOption = "once" | "recurring" | "specific_date";

interface NoCheckInDeliveryOptionsProps {
  deliveryOption: DeliveryOption;
  setDeliveryOption: (option: DeliveryOption) => void;
}

export function NoCheckInDeliveryOptions({
  deliveryOption,
  setDeliveryOption
}: NoCheckInDeliveryOptionsProps) {
  return (
    <div className="space-y-4 mt-4">
      <Label className="font-medium">How should the message be delivered?</Label>
      
      <RadioGroup 
        value={deliveryOption} 
        onValueChange={(value) => setDeliveryOption(value as DeliveryOption)}
        className="grid grid-cols-1 gap-3"
      >
        <div className="flex items-start space-x-2 p-3 rounded-md border hover:bg-muted/50 transition-colors">
          <RadioGroupItem value="once" id="delivery-once" className="mt-1" />
          <div className="space-y-1">
            <div className="flex items-center">
              <Label htmlFor="delivery-once" className="font-medium cursor-pointer">Once off</Label>
              <Clock className="h-4 w-4 ml-2 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Send the message only once if you don't check in</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2 p-3 rounded-md border hover:bg-muted/50 transition-colors">
          <RadioGroupItem value="recurring" id="delivery-recurring" className="mt-1" />
          <div className="space-y-1">
            <div className="flex items-center">
              <Label htmlFor="delivery-recurring" className="font-medium cursor-pointer">Regular schedule</Label>
              <Repeat className="h-4 w-4 ml-2 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Send the message repeatedly on a schedule if you don't check in</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2 p-3 rounded-md border hover:bg-muted/50 transition-colors">
          <RadioGroupItem value="specific_date" id="delivery-date" className="mt-1" />
          <div className="space-y-1">
            <div className="flex items-center">
              <Label htmlFor="delivery-date" className="font-medium cursor-pointer">Specific date and time</Label>
              <Calendar className="h-4 w-4 ml-2 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Send the message on a specific date and time if you don't check in</p>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}
