
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { triggerManualReminder } from "@/services/messages/whatsApp/whatsAppReminderService";
import { toast } from "@/components/ui/use-toast";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Card } from "@/components/ui/card";

interface DeadmanSwitchControlsProps {
  messageId: string;
  reminderHours?: number[];
  isArmed: boolean;
}

export function DeadmanSwitchControls({ 
  messageId, 
  reminderHours = [],
  isArmed
}: DeadmanSwitchControlsProps) {
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  
  // Only show reminders section if there are reminder hours configured
  if (reminderHours.length === 0) {
    return null;
  }

  const handleTestReminder = async () => {
    try {
      setIsSendingReminder(true);
      await triggerManualReminder(messageId);
      toast({
        title: "Test reminder triggered",
        description: "The reminder check has been initiated",
      });
    } catch (error) {
      console.error("Error sending test reminder:", error);
      toast({
        title: "Error",
        description: "Failed to trigger test reminder",
        variant: "destructive",
      });
    } finally {
      setIsSendingReminder(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Reminder Settings
        </h3>
        <Button 
          variant="outline"
          size="sm"
          disabled={!isArmed || isSendingReminder}
          onClick={handleTestReminder}
          className={`flex items-center ${HOVER_TRANSITION}`}
        >
          <Bell className="h-3 w-3 mr-1" />
          {isSendingReminder ? "Sending..." : "Test Reminder"}
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {isArmed ? (
          <p>Reminders will be sent to recipients before the message triggers.</p>
        ) : (
          <p>Reminders are only sent when the message is armed.</p>
        )}
      </div>
      
      {reminderHours.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium mb-1">Reminders scheduled at:</p>
          <div className="flex flex-wrap gap-1">
            {reminderHours.sort((a, b) => b - a).map((hour) => (
              <Badge key={hour} variant="secondary" className="text-xs">
                {hour} {hour === 1 ? 'hour' : 'hours'} before deadline
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
