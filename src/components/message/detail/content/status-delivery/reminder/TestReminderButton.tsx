
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
  return (
    <div className="mt-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onTestReminder}
        disabled={isTestingReminder || disabled}
        className={`w-full text-xs ${HOVER_TRANSITION}`}
      >
        {isTestingReminder ? (
          <>
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Testing reminder delivery...
          </>
        ) : (
          "Test Reminder Delivery"
        )}
      </Button>
    </div>
  );
}
