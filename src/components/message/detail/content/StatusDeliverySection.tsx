
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DeliveryIcon } from "../DeliveryIcon";
import { DeadmanSwitchControls } from "./deadman/DeadmanSwitchControls";
import { ReminderHistory } from "./deadman/ReminderHistory";
import { triggerReminderCheck } from "@/services/messages/reminderService";
import { toast } from "@/components/ui/use-toast";
import { Clock, CalendarClock } from "lucide-react";

interface StatusDeliverySectionProps {
  condition: any;
  isArmed: boolean;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  message: any;
  deadline: Date | null;
  lastCheckIn?: string | null;
  checkInCode?: string | null;
}

export function StatusDeliverySection({
  condition,
  isArmed,
  formatDate,
  renderConditionType,
  message,
  deadline,
  lastCheckIn,
  checkInCode
}: StatusDeliverySectionProps) {
  // State for showing reminder history
  const [showReminderHistory, setShowReminderHistory] = useState(false);
  
  // Handle reminder check
  const handleTestReminder = async () => {
    if (!message?.id) return;
    
    try {
      await triggerReminderCheck(message.id);
    } catch (error) {
      console.error("Error triggering reminder check:", error);
      toast({
        title: "Error",
        description: "Failed to trigger reminder check",
        variant: "destructive"
      });
    }
  };

  // Remind the user that this component is empty but doesn't look broken
  if (!condition) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 pb-2">
          <h3 className="text-lg font-medium flex items-center">
            <CalendarClock className="mr-2 h-5 w-5 text-muted-foreground" />
            Delivery Settings
          </h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            No delivery settings configured
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 pb-2">
        <h3 className="text-lg font-medium flex items-center">
          <DeliveryIcon conditionType={condition?.condition_type} />
          Delivery Settings
        </h3>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Delivery Method</div>
              <div className="text-base">{renderConditionType()}</div>
            </div>

            {condition?.condition_type === "no_check_in" && (
              <div>
                <div className="text-sm font-medium mb-1">Trigger Threshold</div>
                <div className="text-base">
                  {condition.hours_threshold} hours
                  {condition.minutes_threshold > 0 && ` ${condition.minutes_threshold} minutes`}{" "}
                  without check-in
                </div>
              </div>
            )}

            {condition?.trigger_date && (
              <div>
                <div className="text-sm font-medium mb-1">Scheduled For</div>
                <div className="text-base">{formatDate(condition.trigger_date)}</div>
              </div>
            )}

            {lastCheckIn && (
              <div>
                <div className="text-sm font-medium mb-1">Last Check-in</div>
                <div className="text-base flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  {formatDate(lastCheckIn)}
                </div>
              </div>
            )}

            {checkInCode && (
              <div>
                <div className="text-sm font-medium mb-1">Check-in Code</div>
                <div className="text-base font-mono">{checkInCode}</div>
              </div>
            )}
          </div>

          {/* Restore DeadmanSwitchControls for reminders */}
          {condition?.reminder_hours && condition.reminder_hours.length > 0 && (
            <DeadmanSwitchControls
              messageId={message.id}
              reminderHours={condition.reminder_hours}
              isArmed={isArmed}
            />
          )}

          {/* Show reminder history when expanded */}
          {showReminderHistory && (
            <div className="mt-2">
              <ReminderHistory messageId={message.id} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
