
import React from "react";

interface ReminderStatusProps {
  isLoading: boolean;
  permissionError: boolean;
  hasReminders: boolean;
  enhancedReminders: {
    formattedShortDate: string;
    formattedText: string;
    isImportant: boolean;
    original: string;
  }[];
  refreshCount: number;
  errorState: string | null;
}

export function ReminderStatus({ 
  isLoading, 
  permissionError, 
  hasReminders, 
  enhancedReminders,
  refreshCount,
  errorState
}: ReminderStatusProps) {
  if (errorState) {
    return (
      <div className="text-red-500 text-xs mb-2">
        {errorState} - Try refreshing the data
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        <span className="font-medium">Status:</span>
        <span className="col-span-2 text-muted-foreground italic">Loading reminder information...</span>
      </div>
    );
  }
  
  if (permissionError) {
    return (
      <div className="grid grid-cols-3 gap-1">
        <span className="font-medium">Status:</span>
        <span className="col-span-2 text-amber-600 italic">
          You don't have permission to view reminders for this message.
        </span>
      </div>
    );
  }

  if (!hasReminders) {
    return (
      <div className="grid grid-cols-3 gap-1">
        <span className="font-medium">Status:</span>
        <span className="col-span-2 text-muted-foreground italic">
          {refreshCount > 3 
            ? "No reminders found. Try checking in again."
            : "No reminders configured"}
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      <span className="font-medium">Status:</span>
      <span className="col-span-2">
        {enhancedReminders.length > 0 
          ? `${enhancedReminders.length} upcoming reminder${enhancedReminders.length !== 1 ? 's' : ''}` 
          : "All reminders sent"}
      </span>
    </div>
  );
}
