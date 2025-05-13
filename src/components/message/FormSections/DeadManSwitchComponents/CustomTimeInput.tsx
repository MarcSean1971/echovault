
import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { snapMinutesTo15MinInterval, getValidMinuteOptions } from "./reminder/TimeConversionUtils";

interface CustomTimeInputProps {
  hours: number;
  setHours: (hours: number) => void;
  minutes: number;
  setMinutes: (minutes: number) => void;
  label?: string;
  description?: string;
}

export function CustomTimeInput({
  hours,
  setHours,
  minutes,
  setMinutes,
  label = "Time threshold",
  description = "Set how much time should pass"
}: CustomTimeInputProps) {
  // Get valid minute options for the dropdown
  const minuteOptions = getValidMinuteOptions(); // [0, 15, 30, 45]

  // Validate and handle hours input
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setHours(Math.max(0, value));
  };

  // Handle minute selection with dropdown
  const handleMinuteChange = (value: string) => {
    setMinutes(parseInt(value));
  };

  // When component loads, make sure minutes are in 15-minute intervals
  useEffect(() => {
    // Snap to nearest 15-minute interval if not already at one
    if (minutes % 15 !== 0) {
      const snappedMinutes = snapMinutesTo15MinInterval(minutes);
      setMinutes(snappedMinutes);
    }
  }, [minutes, setMinutes]);

  // Convert minutes that are >= 60 to hours
  useEffect(() => {
    if (minutes >= 60) {
      const additionalHours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      setHours(hours + additionalHours);
      setMinutes(remainingMinutes);
    }
  }, [minutes, hours, setHours, setMinutes]);

  return (
    <div className="space-y-2">
      {label && <Label className="block">{label}</Label>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      
      <div className="flex gap-2 items-end">
        <div>
          <Label htmlFor="hours" className="text-xs">Hours</Label>
          <Input 
            id="hours"
            type="number" 
            value={hours} 
            onChange={handleHoursChange} 
            min={0}
            className="w-20 mt-1 hover:border-primary/50 focus:border-primary transition-colors"
          />
        </div>
        <div>
          <Label htmlFor="minutes" className="text-xs">Minutes</Label>
          <Select
            value={minutes.toString()}
            onValueChange={handleMinuteChange}
          >
            <SelectTrigger 
              id="minutes"
              className="w-24 mt-1 hover:border-primary/50 focus:border-primary transition-colors"
            >
              <SelectValue placeholder="0" />
            </SelectTrigger>
            <SelectContent>
              {minuteOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Minutes must be in 15-minute intervals to align with the system schedule.
      </p>
    </div>
  );
}
