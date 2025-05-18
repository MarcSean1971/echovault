
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
    <>
      <div className="grid grid-cols-3 gap-1">
        <span className="font-medium">Status:</span>
        <span className="col-span-2">
          {enhancedReminders.length > 0 
            ? `${enhancedReminders.length} upcoming reminder${enhancedReminders.length !== 1 ? 's' : ''}` 
            : "All reminders sent"}
        </span>
      </div>
      
      {enhancedReminders.length > 0 && (
        <div className="grid grid-cols-3 gap-1">
          <span className="font-medium">Next reminders:</span>
          <div className="col-span-2 flex flex-wrap gap-1">
            {enhancedReminders.map((reminder, index) => (
              <span 
                key={index} 
                className={`inline-block px-2 py-1 ${
                  reminder.isImportant 
                    ? "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100" 
                    : "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                } rounded-md text-xs transition-colors hover:transition-colors`}
                title={reminder.formattedText}
              >
                {reminder.formattedShortDate}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
