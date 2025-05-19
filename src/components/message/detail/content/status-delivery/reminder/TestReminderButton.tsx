
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
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
  return <div className="mt-3">
      
    </div>;
}
