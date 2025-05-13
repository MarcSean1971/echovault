
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Clock, AlertCircle, SendHorizontal, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { triggerManualReminder, triggerDeadmanSwitch } from "@/services/messages/whatsApp";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface DeadmanSwitchControlsProps {
  messageId: string;
  reminderMinutes?: number[]; // Renamed from reminderHours to reminderMinutes for clarity
  isArmed: boolean;
}

export function DeadmanSwitchControls({ 
  messageId, 
  reminderMinutes = [], // Variable renamed for clarity
  isArmed
}: DeadmanSwitchControlsProps) {
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  // Convert minutes to hours and minutes
  const minutesToHoursAndMinutes = (totalMinutes: number): { hours: number, minutes: number } => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  };

  // Format reminder time from minutes to human readable format
  const formatReminderTime = (totalMinutes: number): string => {
    const { hours, minutes } = minutesToHoursAndMinutes(totalMinutes);
    
    if (hours === 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    } else if (minutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} and ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
  };

  const handleTestReminder = async () => {
    try {
      setIsSendingReminder(true);
      console.log(`Triggering manual reminder for message ${messageId}`);
      
      if (!isArmed) {
        toast({
          title: "Message not armed",
          description: "The message must be armed before sending test reminders.",
          variant: "destructive",
          duration: 5000,
        });
        setIsSendingReminder(false);
        return;
      }
      
      toast({
        title: "Sending test reminder",
        description: "Initiating reminder check...",
        duration: 3000,
      });
      
      // Fix: Removing the second argument, as triggerManualReminder expects only messageId
      const result = await triggerManualReminder(messageId);
      
      if (result.success) {
        console.log(`Reminder triggered successfully for message ${messageId}`);
      } else {
        console.error("Error triggering reminder:", result.error);
        toast({
          title: "Error sending reminder",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Error sending test reminder:", error);
      toast({
        title: "Error",
        description: "Failed to trigger test reminder: " + (error.message || "Check the console for details"),
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSendingReminder(false);
    }
  };

  // Added new handler for manual message delivery trigger
  const handleForceDelivery = async () => {
    try {
      setIsSendingMessage(true);
      console.log(`Force delivering message ${messageId}`);
      
      toast({
        title: "Forcing message delivery",
        description: "Manually triggering deadman's switch...",
        duration: 3000,
      });
      
      const result = await triggerDeadmanSwitch(messageId);
      
      if (result.success) {
        console.log(`Message delivery triggered successfully for ${messageId}`);
      } else {
        console.error("Error triggering message delivery:", result.error);
        toast({
          title: "Error delivering message",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Error forcing message delivery:", error);
      toast({
        title: "Error",
        description: "Failed to deliver message: " + (error.message || "Check the console for details"),
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium flex items-center">
          <Clock className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} />
          Reminder Settings
        </h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            size="sm"
            disabled={!isArmed || isSendingReminder}
            onClick={handleTestReminder}
            className={`flex items-center ${HOVER_TRANSITION}`}
          >
            <Bell className={`h-3 w-3 mr-1 ${HOVER_TRANSITION}`} />
            {isSendingReminder ? "Sending..." : "Test Reminder"}
          </Button>
          
          {/* Add a new button for manual delivery */}
          <Button 
            variant="outline"
            size="sm"
            disabled={!isArmed || isSendingMessage}
            onClick={handleForceDelivery}
            className={`flex items-center ${HOVER_TRANSITION}`}
          >
            <SendHorizontal className={`h-3 w-3 mr-1 ${HOVER_TRANSITION}`} />
            {isSendingMessage ? "Sending..." : "Force Delivery"}
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {isArmed ? (
          <p>Reminders will be sent to recipients before the message triggers.</p>
        ) : (
          <p className="text-amber-600 font-medium">Message must be armed before reminders can be sent.</p>
        )}
      </div>
      
      {reminderMinutes.length > 0 ? (
        <div className="mt-2">
          <p className="text-xs font-medium mb-1">Reminders scheduled at:</p>
          <div className="flex flex-wrap gap-1">
            {reminderMinutes.sort((a, b) => b - a).map((minutes) => (
              <Badge 
                key={minutes} 
                variant="secondary" 
                className={`text-xs ${HOVER_TRANSITION}`}
              >
                {formatReminderTime(minutes)} before deadline
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-2">
          <div className="flex items-center">
            <AlertCircle className="h-3 w-3 text-amber-600 mr-1" />
            <p className="text-xs text-amber-600">No reminders configured for this message.</p>
          </div>
        </div>
      )}
      
      {/* Add a notice for manual delivery */}
      <div className="mt-3 border-t pt-3">
        <div className="flex items-center text-xs">
          <RefreshCw className="h-3 w-3 text-blue-500 mr-1" />
          <p className="text-muted-foreground">
            If the automatic delivery fails, use the "Force Delivery" button to manually deliver the message.
          </p>
        </div>
      </div>
    </div>
  );
}
