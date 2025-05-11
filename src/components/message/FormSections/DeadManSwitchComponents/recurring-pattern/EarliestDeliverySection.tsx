
import { Label } from "@/components/ui/label";
import { DatePicker } from "../DatePicker";

interface EarliestDeliverySectionProps {
  startDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
}

export function EarliestDeliverySection({ startDate, onStartDateChange }: EarliestDeliverySectionProps) {
  return (
    <div>
      <Label className="mb-2 block">Earliest Possible Delivery (Optional)</Label>
      <p className="text-sm text-muted-foreground mb-3">
        If specified, recurring messages will only begin on or after this date, even if triggered earlier.
      </p>
      <DatePicker
        selectedDate={startDate}
        setSelectedDate={onStartDateChange}
        label="Earliest Delivery Date & Time"
      />
    </div>
  );
}
