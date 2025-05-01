
import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  // Validate and handle hours input
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setHours(Math.max(0, value));
  };

  // Validate and handle minutes input
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    // Minutes should be between 0-59
    setMinutes(Math.min(59, Math.max(0, value)));
  };

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
      
      <div className="flex gap-4 items-end">
        <div className="w-1/2">
          <Label htmlFor="hours" className="text-sm">Hours</Label>
          <Input 
            id="hours"
            type="number" 
            value={hours} 
            onChange={handleHoursChange} 
            min={0}
            className="mt-1"
          />
        </div>
        <div className="w-1/2">
          <Label htmlFor="minutes" className="text-sm">Minutes</Label>
          <Input 
            id="minutes"
            type="number" 
            value={minutes} 
            onChange={handleMinutesChange} 
            min={0}
            max={59}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}
