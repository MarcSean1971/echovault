
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

  const handleAddReminder = () => {
    const hourValue = parseInt(newHour);
    if (!isNaN(hourValue) && hourValue > 0 && !reminderHours.includes(hourValue)) {
      // If maxHours is provided, ensure the reminder hour is less than it
      if (maxHours && hourValue >= maxHours) {
        return;
      }
      setReminderHours([...reminderHours, hourValue].sort((a, b) => a - b));
      setNewHour("");
    }
  };
  
  const handleRemoveReminder = (hour: number) => {
    setReminderHours(reminderHours.filter(h => h !== hour));
  };
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="reminder-hours">Reminder notifications</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Send reminders before the message is delivered (hours before)
          {maxHours && ` (max ${maxHours} hours)`}
        </p>
      </div>

      {reminderHours.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {reminderHours.map(hour => (
            <Badge key={hour} variant="secondary" className="flex items-center gap-1">
              {hour} {hour === 1 ? 'hour' : 'hours'} before
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => handleRemoveReminder(hour)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      <div className="flex gap-2">
        <Input
          id="reminder-hours"
          type="number"
          min="1"
          max={maxHours}
          placeholder="Hours before"
          value={newHour}
          onChange={(e) => setNewHour(e.target.value)}
          className="w-32"
        />
        
        <Button 
          type="button" 
          variant="outline" 
          size="icon"
          onClick={handleAddReminder}
          disabled={!newHour || isNaN(parseInt(newHour)) || parseInt(newHour) <= 0 || (maxHours ? parseInt(newHour) >= maxHours : false)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
