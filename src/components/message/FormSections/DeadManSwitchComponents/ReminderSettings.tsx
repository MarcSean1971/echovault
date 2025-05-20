
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { ReminderBadges } from "./reminder/ReminderBadges";
import { AddReminderForm } from "./reminder/AddReminderForm";
import { formatThreshold } from "./reminder/TimeConversionUtils";

interface ReminderSettingsProps {
  reminderMinutes: number[]; // These are stored as minutes in the database
  setReminderMinutes: (minutes: number[]) => void;
  maxMinutes?: number; // This is also in minutes
}

export function ReminderSettings({
  reminderMinutes,
  setReminderMinutes,
  maxMinutes
}: ReminderSettingsProps) {
  // Add a state change effect to track state updates
  const [lastUpdate, setLastUpdate] = useState<string>("initial");
  
  const handleAddReminder = (minutes: number) => {
    // Create a new array to ensure React detects the change
    const newArray = [...reminderMinutes, minutes].sort((a, b) => a - b);
    
    // Enhanced debug logs
    console.log("[ReminderSettings] Current minutes before adding:", reminderMinutes);
    console.log("[ReminderSettings] Adding minutes:", minutes);
    console.log("[ReminderSettings] New sorted array:", newArray);
    
    // Update the state with the new array
    setReminderMinutes(newArray);
    setLastUpdate(`added-${minutes}-${new Date().getTime()}`);
  };
  
  const handleRemoveReminder = (minutes: number) => {
    // Create a new array to ensure React detects the change
    const newArray = reminderMinutes.filter(m => m !== minutes);
    
    // Enhanced debug logs
    console.log("[ReminderSettings] Current minutes before removing:", reminderMinutes);
    console.log("[ReminderSettings] Removing minutes:", minutes);
    console.log("[ReminderSettings] New filtered array:", newArray);
    
    // Update the state with the new array
    setReminderMinutes(newArray);
    setLastUpdate(`removed-${minutes}-${new Date().getTime()}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="reminder-minutes">Reminder notifications</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Send reminders before the message is delivered
          {maxMinutes && ` (must be less than ${formatThreshold(maxMinutes)})`}
        </p>
      </div>

      <ReminderBadges
        reminderMinutes={reminderMinutes}
        onRemoveReminder={handleRemoveReminder}
      />
      
      <AddReminderForm
        onAddReminder={handleAddReminder}
        existingReminders={reminderMinutes}
        maxMinutes={maxMinutes}
      />
    </div>
  );
}
