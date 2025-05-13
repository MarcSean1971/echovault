
import React from "react";
import { useReminderForm } from "./hooks/useReminderForm";
import { ReminderFormUI } from "./ReminderFormUI";

interface AddReminderFormProps {
  onAddReminder: (minutes: number) => void;
  existingReminders: number[];
  maxMinutes?: number;
}

export function AddReminderForm({ 
  onAddReminder, 
  existingReminders, 
  maxMinutes 
}: AddReminderFormProps) {
  const {
    newHour,
    newMinute,
    validationError,
    maxMinutesValue,
    minuteOptions,
    handleHourChange,
    handleMinuteChange,
    handleAddReminder
  } = useReminderForm({
    existingReminders,
    onAddReminder,
    maxMinutes
  });

  const isDisabled = (parseInt(newHour) === 0 && parseInt(newMinute) === 0);

  return (
    <ReminderFormUI
      newHour={newHour}
      newMinute={newMinute}
      validationError={validationError}
      maxMinutesValue={maxMinutesValue}
      minuteOptions={minuteOptions}
      handleHourChange={handleHourChange}
      handleMinuteChange={handleMinuteChange}
      handleAddReminder={handleAddReminder}
      isDisabled={isDisabled}
    />
  );
}
