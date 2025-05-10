
import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Input } from "./input";
import { Label } from "./label";

interface DateTimePickerProps {
  date: Date | null | undefined;
  setDate: (date: Date | null) => void;
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  // Parse time to set on the time input
  const timeValue = date ? format(date, "HH:mm") : "";
  
  // Handle time input change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date) {
      // If no date selected, use today with the selected time
      const today = new Date();
      const [hours, minutes] = e.target.value.split(':').map(Number);
      today.setHours(hours, minutes);
      setDate(today);
      return;
    }
    
    // Update existing date with new time
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes);
    setDate(newDate);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date || undefined}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        <div className="grid gap-1.5">
          <Label htmlFor="time">Time</Label>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              id="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
