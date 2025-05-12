
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { ReminderBadges } from "./reminder/ReminderBadges";
import { AddReminderForm } from "./reminder/AddReminderForm";
import { formatThreshold } from "./reminder/TimeConversionUtils";

interface ReminderSettingsProps {
  reminderMinutes: number[]; // Changed from reminderHours to reminderMinutes for clarity
  setReminderMinutes: (minutes: number[]) => void; // Updated parameter name
  maxMinutes?: number; // Changed from maxHours to maxMinutes
}

export function ReminderSettings({
  reminderMinutes,
  setReminderMinutes,
  maxMinutes
}: ReminderSettingsProps) {
  const handleAddReminder = (minutes: number) => {
    setReminderMinutes([...reminderMinutes, minutes].sort((a, b) => a - b));
  };
  
  const handleRemoveReminder = (minutes: number) => {
    setReminderMinutes(reminderMinutes.filter(m => m !== minutes));
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
