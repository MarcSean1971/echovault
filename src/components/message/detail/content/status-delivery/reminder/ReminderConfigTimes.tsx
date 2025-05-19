import React from "react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
interface ReminderConfigTimesProps {
  reminderMinutes: number[] | null;
}
export function ReminderConfigTimes({
  reminderMinutes
}: ReminderConfigTimesProps) {
  if (!reminderMinutes || reminderMinutes.length === 0) {
    return null;
  }
  return;
}