
import { Label } from "@/components/ui/label";
import { DatePicker } from "../DatePicker";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface EarliestDeliverySectionProps {
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
}

export function EarliestDeliverySection({
  triggerDate,
  setTriggerDate
}: EarliestDeliverySectionProps) {
  // This section is now used only for the once-off delivery option
  // For recurring options, the date picker is handled by RecurringPatternSelector
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
