
import React from "react";
import { Clock } from "lucide-react";
import { MessageDeliverySettings } from "../../MessageDeliverySettings";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useNextReminders } from "@/hooks/useNextReminders"; 
import { parseReminderMinutes } from "@/utils/reminderUtils";

interface DeliverySettingsSectionProps {
  condition: any | null;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  deadline?: Date | null;
  isArmed?: boolean;
  refreshTrigger?: number;
}

export function DeliverySettingsSection({
  condition,
  formatDate,
  renderConditionType,
  deadline,
  isArmed = false,
  refreshTrigger
}: DeliverySettingsSectionProps) {
  if (!condition) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
        <Clock className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
        Delivery Settings
      </h3>
      <MessageDeliverySettings 
        condition={condition}
        formatDate={formatDate}
        renderConditionType={renderConditionType}
        showInTabs={true}
      />
    </div>
  );
}
