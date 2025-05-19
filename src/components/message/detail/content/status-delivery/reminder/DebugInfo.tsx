
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
  return;
}
