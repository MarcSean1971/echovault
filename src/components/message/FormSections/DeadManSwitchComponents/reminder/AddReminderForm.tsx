
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Plus } from "lucide-react";
import { 
  hoursMinutesToMinutes, 
  snapMinutesTo15MinInterval, 
  isValidMinuteInterval,
  getValidMinuteOptions
} from "./TimeConversionUtils";
import { useHoverEffects } from "@/hooks/useHoverEffects";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AddReminderFormProps {
  onAddReminder: (minutes: number) => void;
  existingReminders: number[];
  maxMinutes?: number;
}

export function AddReminderForm({ 
  onAddReminder, 
  existingReminders, 
  maxMinutes 
}: AddReminderFormProps) {
  const [newHour, setNewHour] = useState<string>("");
  const [newMinute, setNewMinute] = useState<string>("0");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [maxMinutesValue, setMaxMinutesValue] = useState<number>(45);
  const { getIconHoverClasses } = useHoverEffects();
  
  // Available minute options (0, 15, 30, 45)
  const minuteOptions = getValidMinuteOptions();

  // Update maxMinutes when newHour or maxHours changes
  useEffect(() => {
    if (maxMinutes) {
      const hourValue = parseInt(newHour) || 0;
      const hourInMinutes = hourValue * 60;
      
      // Calculate maximum allowed minute option based on maxMinutes
      if (hourInMinutes + 45 > maxMinutes) {
        // Find the highest valid minute option that doesn't exceed maxMinutes
        const remainingMinutes = Math.max(0, maxMinutes - hourInMinutes);
        // Get the highest valid minute option that doesn't exceed remainingMinutes
        const validOption = Math.floor(remainingMinutes / 15) * 15;
        setMaxMinutesValue(validOption);
      } else {
        // Otherwise, full range of minutes
        setMaxMinutesValue(45);
      }
    }
  }, [newHour, maxMinutes]);

  // Validate the current input combination
  const validateCurrentInput = (hour: string, minute: string): boolean => {
    if (!maxMinutes) return true;
    
    const hourValue = parseInt(hour) || 0;
    const minuteValue = parseInt(minute) || 0;
    
    // Convert to total minutes for comparison
    const totalMinutes = hoursMinutesToMinutes(hourValue, minuteValue);
    
    // Check if it's a valid 15-minute interval
    if (minuteValue % 15 !== 0) {
      return false;
    }
    
    // Compare to maxMinutes
    return totalMinutes < maxMinutes;
  };

  // Handle hour input change
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewHour(value);
    
    // If the new hour is valid but would make the current minute invalid,
    // adjust the minute value
    if (maxMinutes) {
      const hourValue = parseInt(value) || 0;
      const hourInMinutes = hourValue * 60;
      const currentMinuteValue = parseInt(newMinute) || 0;
      
      if (hourInMinutes + currentMinuteValue > maxMinutes) {
        // Find the highest valid minute option that doesn't exceed maxMinutes
        const remainingMinutes = Math.max(0, maxMinutes - hourInMinutes);
        const validOption = Math.floor(remainingMinutes / 15) * 15;
        setNewMinute(validOption.toString());
      }
    }
    
    // Clear validation error if the combination is now valid
    if (validateCurrentInput(value, newMinute)) {
      setValidationError(null);
    }
  };

  // Handle minute selection change
  const handleMinuteChange = (value: string) => {
    // Validate the new minute value
    if (maxMinutes) {
      const hourValue = parseInt(newHour) || 0;
      const minuteValue = parseInt(value) || 0;
      const totalMinutes = hourValue * 60 + minuteValue;
      
      if (totalMinutes > maxMinutes) {
        setValidationError(`Total time must be less than ${Math.floor(maxMinutes / 60)} hours and ${maxMinutes % 60} minutes`);
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
    
    // Validate that minutes are on a 15-minute interval
    if (!isValidMinuteInterval(minuteValue)) {
      setValidationError("Minutes must be in 15-minute intervals (0, 15, 30, 45)");
      return;
    }
    
    // Convert to minutes for storage
    const totalMinutes = hoursMinutesToMinutes(hourValue, minuteValue);
    
    // If maxMinutes is provided, ensure the combined value is less than it
    if (maxMinutes && totalMinutes >= maxMinutes) {
      setValidationError(`Reminder time must be less than the check-in threshold (${Math.floor(maxMinutes / 60)} hours and ${maxMinutes % 60} minutes)`);
      return;
    }
    
    // Check if this time already exists in the array
    if (!existingReminders.includes(totalMinutes)) {
      onAddReminder(totalMinutes);
      setNewHour("");
      setNewMinute("0");
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
            max={maxMinutes ? Math.floor(maxMinutes / 60) : undefined}
            placeholder="0"
            value={newHour}
            onChange={handleHourChange}
            className="w-20 hover:border-primary/50 focus:border-primary transition-colors"
          />
        </div>
        
        <div>
          <Label htmlFor="reminder-minutes" className="text-xs">Minutes</Label>
          <Select
            value={newMinute}
            onValueChange={handleMinuteChange}
          >
            <SelectTrigger id="reminder-minutes" className="w-24 hover:border-primary/50 focus:border-primary transition-colors">
              <SelectValue placeholder="0" />
            </SelectTrigger>
            <SelectContent>
              {minuteOptions
                .filter(option => option <= maxMinutesValue)
                .map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button" 
                variant="secondary" 
                size="icon"
                onClick={handleAddReminder}
                disabled={(parseInt(newHour) === 0 && parseInt(newMinute) === 0)}
              >
                <Plus className={getIconHoverClasses("primary")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add reminder</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {validationError && (
        <div className="flex items-center text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground mt-1">
        Reminders must be set at 15-minute intervals to align with the system schedule.
      </p>
    </div>
  );
}
