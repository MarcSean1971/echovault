
import React from "react";
import { Clock } from "lucide-react";
import { MessageDeliverySettings } from "../../MessageDeliverySettings";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useNextReminders } from "@/hooks/useNextReminders"; 
import { parseReminderMinutes } from "@/utils/reminderUtils";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";
import { cn } from "@/lib/utils";

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
  
  // Get countdown timer data using the same hook as message cards
  const { timeLeft, isUrgent, isVeryUrgent } = useCountdownTimer({
    deadline,
    isArmed,
    refreshTrigger
  });
  
  // Determine the color class for the countdown based on time remaining - same as in message cards
  const getCountdownColorClass = () => {
    if (!isArmed) return "text-muted-foreground";
    if (isVeryUrgent) return "text-destructive font-medium";
    if (isUrgent) return "text-orange-500";
    return "text-destructive/80";
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
        <Clock className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
        Delivery Settings
      </h3>
      
      {/* Simple countdown display that matches the message cards */}
      {isArmed && deadline && (
        <div className={`flex items-center text-xs ${getCountdownColorClass()} mb-3 ${HOVER_TRANSITION}`}>
          <Clock className={`h-3.5 w-3.5 mr-1.5 ${HOVER_TRANSITION}`} />
          <span>Countdown: {timeLeft || "--:--:--"}</span>
        </div>
      )}
      
      <MessageDeliverySettings 
        condition={condition}
        formatDate={formatDate}
        renderConditionType={renderConditionType}
        showInTabs={true}
      />
    </div>
  );
}
