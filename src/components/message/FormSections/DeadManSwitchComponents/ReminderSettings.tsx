
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

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

  // Helper function to convert between display format and storage format
  const decimalToHoursMinutes = (decimalHours: number): { hours: number, minutes: number } => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return { hours, minutes };
  };

  const hoursMinutesToDecimal = (hours: number, minutes: number): number => {
    return hours + (minutes / 60);
  };

  const handleAddReminder = () => {
    const hourValue = parseInt(newHour) || 0;
    const minuteValue = parseInt(newMinute) || 0;
    
    // Validate that we have at least some time value
    if (hourValue === 0 && minuteValue === 0) return;
    
    // Convert to decimal hours for storage
    const decimalHours = hoursMinutesToDecimal(hourValue, minuteValue);
    
    // If maxHours is provided, ensure the combined value is less than it
    if (maxHours && decimalHours >= maxHours) {
      return;
    }
    
    // Check if this time already exists in the array
    if (!reminderHours.includes(decimalHours)) {
      setReminderHours([...reminderHours, decimalHours].sort((a, b) => a - b));
      setNewHour("");
      setNewMinute("");
    }
  };
  
  const handleRemoveReminder = (decimalHours: number) => {
    setReminderHours(reminderHours.filter(h => h !== decimalHours));
  };
  
  // Format the decimal hours for display
  const formatReminderTime = (decimalHours: number): string => {
    const { hours, minutes } = decimalToHoursMinutes(decimalHours);
    
    if (hours === 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    } else if (minutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} and ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="reminder-hours">Reminder notifications</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Send reminders before the message is delivered
          {maxHours && ` (max ${maxHours} hours)`}
        </p>
      </div>

      {reminderHours.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {reminderHours.map(decimalHours => {
            const { hours, minutes } = decimalToHoursMinutes(decimalHours);
            // Use a unique key by combining hours and minutes
            const key = `${hours}-${minutes}`;
            
            return (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {formatReminderTime(decimalHours)} before
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-muted/80 transition-colors duration-200"
                  onClick={() => handleRemoveReminder(decimalHours)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
      
      <div className="flex gap-2 items-end">
        <div>
          <Label htmlFor="reminder-hours" className="text-xs">Hours</Label>
          <Input
            id="reminder-hours"
            type="number"
            min="0"
            max={maxHours}
            placeholder="0"
            value={newHour}
            onChange={(e) => setNewHour(e.target.value)}
            className="w-20"
          />
        </div>
        
        <div>
          <Label htmlFor="reminder-minutes" className="text-xs">Minutes</Label>
          <Input
            id="reminder-minutes"
            type="number"
            min="0"
            max="59"
            placeholder="0"
            value={newMinute}
            onChange={(e) => setNewMinute(e.target.value)}
            className="w-20"
          />
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          size="icon"
          onClick={handleAddReminder}
          disabled={(parseInt(newHour) === 0 && parseInt(newMinute) === 0) || 
            (maxHours ? parseInt(newHour) >= maxHours && parseInt(newMinute) > 0 : false)}
          className="hover:bg-muted/80 transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
