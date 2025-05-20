
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
  const handleAddReminder = (minutes: number) => {
    // IMPORTANT FIX: Create a new array to ensure React detects the change
    setReminderMinutes([...reminderMinutes, minutes].sort((a, b) => a - b));
    
    // Debug log
    console.log("Added reminder minutes:", minutes);
    console.log("Updated reminder array:", [...reminderMinutes, minutes].sort((a, b) => a - b));
  };
  
  const handleRemoveReminder = (minutes: number) => {
    // IMPORTANT FIX: Create a new array to ensure React detects the change
    setReminderMinutes(reminderMinutes.filter(m => m !== minutes));
    
    // Debug log
    console.log("Removed reminder minutes:", minutes);
    console.log("Updated reminder array:", reminderMinutes.filter(m => m !== minutes));
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
