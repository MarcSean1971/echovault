
import React from "react";

interface ReminderConfigTimesProps {
  reminderMinutes: number[];
}

export function ReminderConfigTimes({ reminderMinutes = [] }: ReminderConfigTimesProps) {
  if (!reminderMinutes || reminderMinutes.length === 0) {
    return null;
  }
  
  const formatTimeUnit = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    } else if (minutes === 60) {
      return "1 hour";
    } else if (minutes % 60 === 0) {
      const hours = minutes / 60;
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hour${hours === 1 ? '' : 's'} and ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
    }
  };
  
  // Sort reminders in descending order (largest first)
  const sortedReminders = [...reminderMinutes].sort((a, b) => b - a);
  
  return (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-3 gap-1 text-sm">
        <span className="font-medium">Reminder times:</span>
        <span className="col-span-2">
          {sortedReminders.map((minutes, index) => (
            <React.Fragment key={minutes}>
              {formatTimeUnit(minutes)}
              {index < sortedReminders.length - 1 ? ', ' : ''}
            </React.Fragment>
          ))}
        </span>
      </div>
    </div>
  );
}
