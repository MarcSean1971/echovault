
import React from "react";

interface DebugInfoProps {
  isVisible: boolean;
  messageId?: string;
  conditionId?: string;
  lastRefreshed: number;
  refreshCount: number;
  reminderMinutes: number[] | null;
  permissionError: boolean;
}

export function DebugInfo({ 
  isVisible, 
  messageId, 
  conditionId, 
  lastRefreshed,
  refreshCount,
  reminderMinutes,
  permissionError
}: DebugInfoProps) {
  if (!isVisible) return null;
  
  return (
    <div className="mt-4 border-t pt-2 text-xs text-muted-foreground">
      <div>Message ID: {messageId}</div>
      <div>Condition ID: {conditionId}</div>
      <div>Last refreshed: {new Date(lastRefreshed || 0).toLocaleTimeString()}</div>
      <div>Refresh count: {refreshCount}</div>
      <div>Reminder minutes: {JSON.stringify(reminderMinutes)}</div>
      {permissionError && <div className="text-amber-600">Permission error detected</div>}
    </div>
  );
}
