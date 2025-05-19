
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
    <div className="text-xs text-muted-foreground border-t border-dashed border-muted mt-2 pt-2">
      <div><strong>Debug Info:</strong></div>
      <div>Message ID: {messageId || 'N/A'}</div>
      <div>Condition ID: {conditionId || 'N/A'}</div>
      <div>Last refreshed: {new Date(lastRefreshed).toLocaleTimeString()}</div>
      <div>Refresh count: {refreshCount}</div>
      <div>Reminder minutes: {reminderMinutes ? reminderMinutes.join(', ') : 'None'}</div>
      <div>Permission error: {permissionError ? 'Yes' : 'No'}</div>
    </div>
  );
}
