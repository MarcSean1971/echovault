
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { DatePicker } from "../DatePicker";
import { DatePickerOptionProps } from "./types";

export function EarliestDeliveryOption({ 
  startDate, 
  setStartDate, 
  pattern, 
  setPattern 
}: DatePickerOptionProps) {
  const handleDateChange = (date: Date | null) => {
    setStartDate(date);
    if (pattern) {
      setPattern({ 
        ...pattern, 
        startDate: date ? format(date, 'yyyy-MM-dd') : undefined 
      });
    }
  };
  
  return (
    <div>
      <Label className="mb-2 block">Earliest Possible Delivery (Optional)</Label>
      <p className="text-sm text-muted-foreground mb-3">
        If specified, recurring messages will only begin on or after this date, even if triggered earlier.
      </p>
      <DatePicker
        selectedDate={startDate}
        setSelectedDate={handleDateChange}
        label="Earliest Delivery Date & Time"
      />
    </div>
  );
}
