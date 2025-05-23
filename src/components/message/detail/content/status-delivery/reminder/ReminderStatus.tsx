
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
      <div className="text-red-500 text-sm">
        {errorState} - Try refreshing the data
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1 text-sm">
        <span className="font-medium">Status:</span>
        <span className="col-span-2 text-muted-foreground italic">Loading reminder information...</span>
      </div>
    );
  }
  
  if (permissionError) {
    return (
      <div className="grid grid-cols-3 gap-1 text-sm">
        <span className="font-medium">Status:</span>
        <span className="col-span-2 text-amber-600 italic">
          You don't have permission to view reminders for this message.
        </span>
      </div>
    );
  }
  
  if (!hasReminders) {
    return (
      <div className="grid grid-cols-3 gap-1 text-sm">
        <span className="font-medium">Status:</span>
        <span className="col-span-2 text-muted-foreground italic">
          {refreshCount > 3 ? "No reminders found. Try checking in again." : "No reminders configured"}
        </span>
      </div>
    );
  }
  
  // CRITICAL FIX: Actually render reminders when they exist instead of returning null
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1 text-sm">
        <span className="font-medium">Status:</span>
        <span className="col-span-2 text-emerald-600 font-medium">
          {enhancedReminders.length} reminder{enhancedReminders.length !== 1 ? 's' : ''} configured
        </span>
      </div>
      
      {/* Display the actual reminders */}
      <div className="mt-2 space-y-1">
        {enhancedReminders.map((reminder, index) => (
          <div 
            key={`${reminder.original}-${index}`}
            className={`flex items-start rounded px-2 py-1 ${
              reminder.isImportant 
                ? 'bg-red-50 text-red-800' 
                : 'bg-blue-50 text-blue-800'
            }`}
          >
            <span className="mr-2 flex-shrink-0">•</span>
            <span>{reminder.formattedText}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
