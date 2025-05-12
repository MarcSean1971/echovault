
import { Label } from "@/components/ui/label";
import { DatePicker } from "../DatePicker";

interface EarliestDeliverySectionProps {
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
}

export function EarliestDeliverySection({
  triggerDate,
  setTriggerDate
}: EarliestDeliverySectionProps) {
  return (
    <div className="mt-6 border-t pt-4">
      <div className="space-y-2">
        <Label className="font-medium mb-2 block">Earliest Possible Delivery (Optional)</Label>
        <p className="text-sm text-muted-foreground mb-3">
          If specified, the message will only be delivered on or after this date, even if triggered earlier.
        </p>
        <DatePicker 
          selectedDate={triggerDate} 
          setSelectedDate={setTriggerDate}
          label="Earliest Delivery Date & Time" 
        />
      </div>
    </div>
  );
}
