
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  selectedDate: Date | null | undefined;
  setSelectedDate: (date: Date | null) => void;
  label?: string; // Keep the prop for backward compatibility
}

export function DatePicker({ 
  selectedDate, 
  setSelectedDate, 
  label = "Date" // Default value kept for compatibility
}: DatePickerProps) {
  const [time, setTime] = useState("12:00");
  
  // Initialize time from selectedDate if available
  useEffect(() => {
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    }
  }, [selectedDate]);
  
  const handleDateChange = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(null);
      return;
    }
    
    // Merge the selected date with the time
    const [hours, minutes] = time.split(':').map(Number);
    date.setHours(hours);
    date.setMinutes(minutes);
    
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
      <div className="grid grid-cols-3 gap-2">
        <Popover>
          <PopoverTrigger asChild className="col-span-2">
            <Button
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal hover:bg-muted/80 transition-colors",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDateChange}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        
        <Input 
          type="time" 
          value={time}
          onChange={handleTimeChange}
          className="col-span-1 hover:border-primary/50 focus:border-primary transition-colors"
        />
      </div>
    </div>
  );
}
