import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReminderSettingsProps {
  reminderHours: number[];
  setReminderHours: (value: number[]) => void;
  maxHours: number;
}

export function ReminderSettings({
  reminderHours,
  setReminderHours,
  maxHours
}: ReminderSettingsProps) {
  const [selectedPreset, setSelectedPreset] = useState("");
  
  const handleAddReminder = (hours: number) => {
    if (hours <= 0 || hours >= maxHours) return;
    
    // Don't add duplicates
    if (reminderHours.includes(hours)) return;
    
    setReminderHours([...reminderHours, hours].sort((a, b) => b - a));
  };
  
  const handleRemoveReminder = (index: number) => {
    const newReminders = [...reminderHours];
    newReminders.splice(index, 1);
    setReminderHours(newReminders);
  };
  
  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    
    // Apply preset reminder patterns
    switch (value) {
      case "frequent":
        setReminderHours([24, 12, 6, 3, 1].filter(h => h < maxHours));
        break;
      case "normal":
        setReminderHours([24, 12, 1].filter(h => h < maxHours));
        break;
      case "minimal":
        setReminderHours([24].filter(h => h < maxHours));
        break;
      case "custom":
        // Keep current reminders for custom
        break;
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-2 block">Reminder Settings</Label>
        <Select
          value={selectedPreset || "custom"}
          onValueChange={handlePresetChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select reminder pattern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="frequent">Frequent (24h, 12h, 6h, 3h, 1h before)</SelectItem>
            <SelectItem value="normal">Normal (24h, 12h, 1h before)</SelectItem>
            <SelectItem value="minimal">Minimal (24h before)</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        {reminderHours.length > 0 ? (
          <div className="space-y-2">
            <Label>Remind me before trigger activates:</Label>
            {reminderHours.map((hours, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <span>{hours} {hours === 1 ? 'hour' : 'hours'} before</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveReminder(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No reminders set. You won't be notified before the trigger activates.</p>
        )}
        
        <div className="flex items-center space-x-2 pt-2">
          <Input
            type="number"
            placeholder="Hours before"
            min={1}
            max={maxHours - 1}
            className="w-32"
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value > 0 && value < maxHours) {
                e.target.dataset.value = value.toString();
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.querySelector('input[type="number"]') as HTMLInputElement;
              const value = parseInt(input.value);
              if (!isNaN(value)) {
                handleAddReminder(value);
                input.value = "";
              }
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Reminder
          </Button>
        </div>
      </div>
    </div>
  );
}
