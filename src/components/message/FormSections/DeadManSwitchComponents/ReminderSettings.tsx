
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { ReminderBadges } from "./reminder/ReminderBadges";
import { AddReminderForm } from "./reminder/AddReminderForm";
import { formatThreshold } from "./reminder/TimeConversionUtils";

interface ReminderSettingsProps {
  reminderHours: number[]; // Note: This is actually minutes despite the name
  setReminderHours: (hours: number[]) => void;
  maxHours?: number;
}

export function ReminderSettings({
  reminderHours,
  setReminderHours,
  maxHours
}: ReminderSettingsProps) {
  const handleAddReminder = (minutes: number) => {
    setReminderHours([...reminderHours, minutes].sort((a, b) => a - b));
  };
  
  const handleRemoveReminder = (minutes: number) => {
    setReminderHours(reminderHours.filter(h => h !== minutes));
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

      <ReminderBadges
        reminderMinutes={reminderHours}
        onRemoveReminder={handleRemoveReminder}
      />
      
      <AddReminderForm
        onAddReminder={handleAddReminder}
        existingReminders={reminderHours}
        maxHours={maxHours}
      />
    </div>
  );
}
