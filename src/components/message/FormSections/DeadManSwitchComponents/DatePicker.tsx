
import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  label?: string;
}

export function DatePicker({ 
  selectedDate, 
  setSelectedDate, 
  label = "Date"
}: DatePickerProps) {
  const [time, setTime] = useState("12:00");
  
  const handleDateChange = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined);
      return;
    }
    
    // Merge the selected date with the time
    if (selectedDate) {
      const [hours, minutes] = time.split(':').map(Number);
      date.setHours(hours);
      date.setMinutes(minutes);
    }
    
    setSelectedDate(date);
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    
    if (selectedDate) {
      const [hours, minutes] = e.target.value.split(':').map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setSelectedDate(newDate);
    }
  };
  
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="grid grid-cols-3 gap-2">
        <Popover>
          <PopoverTrigger asChild className="col-span-2">
            <Button
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        <Input 
          type="time" 
          value={time}
          onChange={handleTimeChange}
          className="col-span-1"
        />
      </div>
    </div>
  );
}
