
import React from "react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface ReminderConfigTimesProps {
  reminderMinutes: number[] | null;
}

export function ReminderConfigTimes({ reminderMinutes }: ReminderConfigTimesProps) {
  if (!reminderMinutes || reminderMinutes.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-1 mt-2">
      <span className="font-medium">Configured times:</span>
      <div className="col-span-2 flex flex-wrap gap-1">
        {reminderMinutes.sort((a, b) => b - a).map((minute, index) => (
          <span
            key={index}
            className={`inline-block px-2 py-1 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-md text-xs ${HOVER_TRANSITION}`}
            title={`Reminder scheduled ${minute} minutes before deadline`}
          >
            {minute >= 60 ? `${(minute / 60).toFixed(1)}h` : `${minute}m`}
          </span>
        ))}
      </div>
    </div>
  );
}
