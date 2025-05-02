
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface ReminderSettingsProps {
  reminderHours: number[];
  setReminderHours: (hours: number[]) => void;
  maxHours?: number; // Made this optional
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

      <div className="flex flex-wrap gap-2 mt-2">
        {reminderHours.map((hour) => (
          <div key={hour} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-1">
            <span>{hour}h</span>
            <button 
              type="button" 
              onClick={() => handleRemoveReminder(hour)}
              className="text-secondary-foreground/70 hover:text-secondary-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          id="reminder-hours"
          type="number"
          min="1"
          max={maxHours}
          placeholder="Hours before"
          value={newHour}
          onChange={(e) => setNewHour(e.target.value)}
          className="w-36"
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
