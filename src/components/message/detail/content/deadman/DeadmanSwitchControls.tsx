
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { triggerManualReminder } from "@/services/messages/whatsApp";
import { toast } from "@/components/ui/use-toast";

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

  // Helper function to convert decimal hours to hours and minutes
  const decimalToHoursMinutes = (decimalHours: number): { hours: number, minutes: number } => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return { hours, minutes };
  };

  // Format the decimal hours for display
  const formatReminderTime = (decimalHours: number): string => {
    const { hours, minutes } = decimalToHoursMinutes(decimalHours);
    
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
          className="flex items-center hover:bg-muted/80 transition-colors duration-200"
        >
          <Bell className="h-3 w-3 mr-1" />
          {isSendingReminder ? "Sending..." : "Test Reminder"}
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {isArmed ? (
          <p>Reminders will be sent to recipients before the message triggers.</p>
        ) : (
          <p className="text-amber-600 font-medium">Message must be armed before reminders can be sent.</p>
        )}
      </div>
      
      {reminderHours.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium mb-1">Reminders scheduled at:</p>
          <div className="flex flex-wrap gap-1">
            {reminderHours.sort((a, b) => b - a).map((decimalHours) => (
              <Badge key={decimalHours} variant="secondary" className="text-xs">
                {formatReminderTime(decimalHours)} before deadline
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
