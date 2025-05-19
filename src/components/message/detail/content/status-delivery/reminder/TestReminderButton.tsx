
import React from "react";

interface TestReminderButtonProps {
  onTestReminder: () => Promise<void>;
  isTestingReminder: boolean;
  disabled?: boolean;
}

export function TestReminderButton({
  onTestReminder,
  isTestingReminder,
  disabled = false
}: TestReminderButtonProps) {
  // This component has been removed as part of UI simplification
  // It previously contained a button to test reminder functionality
  return null;
}
