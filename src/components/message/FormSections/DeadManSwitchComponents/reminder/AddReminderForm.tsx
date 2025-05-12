import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Plus } from "lucide-react";
import { hoursMinutesToMinutes } from "./TimeConversionUtils";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface AddReminderFormProps {
  onAddReminder: (minutes: number) => void;
  existingReminders: number[];
  maxHours?: number;
}

export function AddReminderForm({ 
  onAddReminder, 
  existingReminders, 
  maxHours 
}: AddReminderFormProps) {
  const [newHour, setNewHour] = useState<string>("");
  const [newMinute, setNewMinute] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [maxMinutes, setMaxMinutes] = useState<number>(59);

  // Update maxMinutes when newHour or maxHours changes
  useEffect(() => {
    if (maxHours) {
      const hourValue = parseInt(newHour) || 0;
      
      if (hourValue === Math.floor(maxHours)) {
        // If we're at the max hour, restrict minutes
        const maxMinutesValue = Math.floor((maxHours - Math.floor(maxHours)) * 60);
        setMaxMinutes(maxMinutesValue);
      } else {
        // Otherwise, full range of minutes
        setMaxMinutes(59);
      }
    }
  }, [newHour, maxHours]);

  // Validate the current input combination
  const validateCurrentInput = (hour: string, minute: string): boolean => {
    if (!maxHours) return true;
    
    const hourValue = parseInt(hour) || 0;
    const minuteValue = parseInt(minute) || 0;
    
    // Convert to total minutes for comparison
    const totalMinutes = hoursMinutesToMinutes(hourValue, minuteValue);
    
    // Compare to maxHours converted to minutes
    return totalMinutes < (maxHours * 60);
  };

  // Handle hour input change
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewHour(value);
    
    // If the new hour is valid but would make the current minute invalid,
    // adjust the minute value
    if (maxHours && parseInt(value) === Math.floor(maxHours)) {
      const maxMinutesValue = Math.floor((maxHours - Math.floor(maxHours)) * 60);
      if (parseInt(newMinute) > maxMinutesValue) {
        setNewMinute(maxMinutesValue.toString());
      }
    }
    
    // Clear validation error if the combination is now valid
    if (validateCurrentInput(value, newMinute)) {
      setValidationError(null);
    }
  };

  // Handle minute input change
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Validate the new minute value
    if (maxHours) {
      const hourValue = parseInt(newHour) || 0;
      const minuteValue = parseInt(value) || 0;
      
      if (hourValue === Math.floor(maxHours) && minuteValue > maxMinutes) {
        setValidationError(`Minutes must be less than ${maxMinutes + 1} when hours is ${hourValue}`);
        return;
      }
    }
    
    setNewMinute(value);
    
    // Clear validation error if the combination is now valid
    if (validateCurrentInput(newHour, value)) {
      setValidationError(null);
    }
  };

  const handleAddReminder = () => {
    const hourValue = parseInt(newHour) || 0;
    const minuteValue = parseInt(newMinute) || 0;
    
    // Clear any previous validation errors
    setValidationError(null);
    
    // Validate that we have at least some time value
    if (hourValue === 0 && minuteValue === 0) {
      setValidationError("Please enter a reminder time");
      return;
    }
    
    // Convert to minutes for storage
    const totalMinutes = hoursMinutesToMinutes(hourValue, minuteValue);
    
    // If maxHours is provided, ensure the combined value is less than it
    if (maxHours && totalMinutes >= (maxHours * 60)) {
      setValidationError(`Reminder time must be less than the check-in threshold (${Math.floor(maxHours * 60)} minutes)`);
      return;
    }
    
    // Check if this time already exists in the array
    if (!existingReminders.includes(totalMinutes)) {
      onAddReminder(totalMinutes);
      setNewHour("");
      setNewMinute("");
    } else {
      setValidationError("This reminder time already exists");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-end">
        <div>
          <Label htmlFor="reminder-hours" className="text-xs">Hours</Label>
          <Input
            id="reminder-hours"
            type="number"
            min="0"
            max={maxHours ? Math.floor(maxHours) : undefined}
            placeholder="0"
            value={newHour}
            onChange={handleHourChange}
            className="w-20 hover:border-primary/50 focus:border-primary transition-colors"
          />
        </div>
        
        <div>
          <Label htmlFor="reminder-minutes" className="text-xs">Minutes</Label>
          <Input
            id="reminder-minutes"
            type="number"
            min="0"
            max={maxMinutes}
            placeholder="0"
            value={newMinute}
            onChange={handleMinuteChange}
            className="w-20 hover:border-primary/50 focus:border-primary transition-colors"
          />
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          size="icon"
          onClick={handleAddReminder}
          disabled={(parseInt(newHour) === 0 && parseInt(newMinute) === 0)}
          className={`hover:bg-muted/80 ${HOVER_TRANSITION}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {validationError && (
        <div className="flex items-center text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
