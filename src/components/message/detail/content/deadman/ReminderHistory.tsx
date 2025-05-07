
import { useState, useEffect } from "react";
import { Clock, History } from "lucide-react";
import { getReminderHistory, Reminder } from "@/services/messages/reminderService";
import { Separator } from "@/components/ui/separator";

interface ReminderHistoryProps {
  messageId: string;
}

export function ReminderHistory({ messageId }: ReminderHistoryProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        setIsLoading(true);
        const reminderHistory = await getReminderHistory(messageId);
        setReminders(reminderHistory);
      } catch (error) {
        console.error("Error fetching reminder history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReminders();
  }, [messageId]);
  
  if (isLoading) {
    return (
      <div className="mt-2 py-2 text-sm text-center text-muted-foreground">
        Loading reminder history...
      </div>
    );
  }
  
  if (reminders.length === 0) {
    return (
      <div className="mt-2 py-2 text-sm text-center text-muted-foreground">
        No reminders have been sent yet.
      </div>
    );
  }
  
  return (
    <div className="mt-2">
      <h4 className="text-sm font-medium flex items-center mb-2">
        <History className="h-4 w-4 mr-1" />
        Recent Reminder History
      </h4>
      
      <div className="max-h-40 overflow-y-auto border rounded-md p-2 text-sm">
        {reminders.slice(0, 5).map((reminder) => (
          <div key={reminder.id} className="py-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs">
                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                <span>
                  Sent: {new Date(reminder.sent_at).toLocaleString()}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Deadline: {new Date(reminder.deadline).toLocaleString()}
              </span>
            </div>
            {reminder !== reminders[reminders.length - 1] && (
              <Separator className="my-1" />
            )}
          </div>
        ))}
        
        {reminders.length > 5 && (
          <div className="text-center text-xs text-muted-foreground mt-1">
            + {reminders.length - 5} more reminders
          </div>
        )}
      </div>
    </div>
  );
}
