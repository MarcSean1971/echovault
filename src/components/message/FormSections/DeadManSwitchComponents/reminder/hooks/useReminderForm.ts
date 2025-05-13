import { useState, useEffect } from "react";
import { validateReminderTime } from "../utils/reminderValidation";
import { hoursMinutesToMinutes, getValidMinuteOptions } from "../TimeConversionUtils";

interface UseReminderFormProps {
  existingReminders: number[];
  onAddReminder: (minutes: number) => void;
  maxMinutes?: number;
}

export function useReminderForm({
  existingReminders,
  onAddReminder,
  maxMinutes
}: UseReminderFormProps) {
  const [newHour, setNewHour] = useState<string>("");
  const [newMinute, setNewMinute] = useState<string>("0");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [maxMinutesValue, setMaxMinutesValue] = useState<number>(45);
  
  // Available minute options (0, 15, 30, 45)
  const minuteOptions = getValidMinuteOptions();

  // Update maxMinutes when newHour or maxHours changes
  useEffect(() => {
    if (maxMinutes) {
      const hourValue = parseInt(newHour) || 0;
      const hourInMinutes = hourValue * 60;
      
      // Calculate maximum allowed minute option based on maxMinutes
      if (hourInMinutes + 45 > maxMinutes) {
        // Find the highest valid minute option that doesn't exceed maxMinutes
        const remainingMinutes = Math.max(0, maxMinutes - hourInMinutes);
        // Get the highest valid minute option that doesn't exceed remainingMinutes
        const validOption = Math.floor(remainingMinutes / 15) * 15;
        setMaxMinutesValue(validOption);
      } else {
        // Otherwise, full range of minutes
        setMaxMinutesValue(45);
      }
    }
  }, [newHour, maxMinutes]);

  // Validate the current input combination
  const validateCurrentInput = (hour: string, minute: string): boolean => {
    if (!maxMinutes) return true;
    
    const hourValue = parseInt(hour) || 0;
    const minuteValue = parseInt(minute) || 0;
    
    // Convert to total minutes for comparison
    const totalMinutes = hoursMinutesToMinutes(hourValue, minuteValue);
    
    // Check if it's a valid 15-minute interval
    if (minuteValue % 15 !== 0) {
      return false;
    }
    
    // Compare to maxMinutes
    return totalMinutes < maxMinutes;
  };

  // Handle hour input change
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewHour(value);
    
    // If the new hour is valid but would make the current minute invalid,
    // adjust the minute value
    if (maxMinutes) {
      const hourValue = parseInt(value) || 0;
      const hourInMinutes = hourValue * 60;
      const currentMinuteValue = parseInt(newMinute) || 0;
      
      if (hourInMinutes + currentMinuteValue > maxMinutes) {
        // Find the highest valid minute option that doesn't exceed maxMinutes
        const remainingMinutes = Math.max(0, maxMinutes - hourInMinutes);
        const validOption = Math.floor(remainingMinutes / 15) * 15;
        setNewMinute(validOption.toString());
      }
    }
    
    // Clear validation error if the combination is now valid
    if (validateCurrentInput(value, newMinute)) {
      setValidationError(null);
    }
  };

  // Handle minute selection change
  const handleMinuteChange = (value: string) => {
    // Validate the new minute value
    if (maxMinutes) {
      const hourValue = parseInt(newHour) || 0;
      const minuteValue = parseInt(value) || 0;
      const totalMinutes = hourValue * 60 + minuteValue;
      
      if (totalMinutes > maxMinutes) {
        setValidationError(`Total time must be less than ${Math.floor(maxMinutes / 60)} hours and ${maxMinutes % 60} minutes`);
        return;
      }
    }
    
    setNewMinute(value);
    
    // Clear validation error if the combination is now valid
    if (validateCurrentInput(newHour, value)) {
      setValidationError(null);
    }
  };

  const handleAddReminder = () => {
    const hourValue = parseInt(newHour) || 0;
    const minuteValue = parseInt(newMinute) || 0;
    
    // Validate the reminder time
    const validation = validateReminderTime(
      hourValue,
      minuteValue,
      existingReminders,
      maxMinutes
    );
    
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }
    
    // Clear any previous validation errors
    setValidationError(null);
    
    // Convert to minutes for storage
    const totalMinutes = hoursMinutesToMinutes(hourValue, minuteValue);
    
    // Add the reminder
    onAddReminder(totalMinutes);
    
    // Reset form
    setNewHour("");
    setNewMinute("0");
  };

  return {
    newHour,
    newMinute,
    validationError,
    maxMinutesValue,
    minuteOptions,
    handleHourChange,
    handleMinuteChange,
    handleAddReminder
  };
}
