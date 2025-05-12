
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, X } from "lucide-react";

interface ReminderSettingsProps {
  reminderHours: number[];
  setReminderHours: (hours: number[]) => void;
  maxHours?: number;
}

export function ReminderSettings({
  reminderHours,
  setReminderHours,
  maxHours
}: ReminderSettingsProps) {
  const [newHour, setNewHour] = useState<string>("");
  const [newMinute, setNewMinute] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [maxMinutes, setMaxMinutes] = useState<number>(59);

  // Convert from minutes to hours and minutes for display
  // Note that reminderHours array actually contains minute values
  const minutesToHoursAndMinutes = (totalMinutes: number): { hours: number, minutes: number } => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  };

  // Format the threshold for display in error messages and labels
  const formatThreshold = (decimalHours: number): string => {
    const { hours, minutes } = minutesToHoursAndMinutes(decimalHours);
    if (hours === 0) {
      return `${minutes} minutes`;
    } else if (minutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} and ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
  };

  // Convert hours and minutes to minutes for storage
  const hoursMinutesToMinutes = (hours: number, minutes: number): number => {
    return (hours * 60) + minutes;
  };

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
      setValidationError(`Reminder time must be less than the check-in threshold (${formatThreshold(maxHours * 60)})`);
      return;
    }
    
    // Check if this time already exists in the array
    if (!reminderHours.includes(totalMinutes)) {
      setReminderHours([...reminderHours, totalMinutes].sort((a, b) => a - b));
      setNewHour("");
      setNewMinute("");
    } else {
      setValidationError("This reminder time already exists");
    }
  };
  
  const handleRemoveReminder = (minutes: number) => {
    setReminderHours(reminderHours.filter(h => h !== minutes));
  };
  
  // Format the minutes for display
  const formatReminderTime = (minutes: number): string => {
    const { hours, minutes: mins } = minutesToHoursAndMinutes(minutes);
    
    if (hours === 0) {
      return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
    } else if (mins === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} and ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="reminder-hours">Reminder notifications</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Send reminders before the message is delivered
          {maxHours && ` (must be less than ${formatThreshold(maxHours * 60)})`}
        </p>
      </div>

      {reminderHours.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {reminderHours.map(minutes => (
              <Badge key={minutes} variant="secondary" className="flex items-center gap-1 hover:bg-slate-200 transition-colors duration-200">
                {formatReminderTime(minutes)} before
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-muted/80 transition-colors duration-200"
                  onClick={() => handleRemoveReminder(minutes)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          )}
        </div>
      )}
      
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
            className="hover:bg-muted/80 transition-colors duration-200"
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
    </div>
  );
}
