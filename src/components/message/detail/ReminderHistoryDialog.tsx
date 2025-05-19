
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate } from "@/utils/messageHelpers";
import { Loader2, Clock, Mail, Calendar } from "lucide-react";
import { getReminderHistory, Reminder } from "@/services/messages/reminder"; // Changed from reminderService to reminder
import { ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface ReminderHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
}

export function ReminderHistoryDialog({
  open,
  onOpenChange,
  messageId,
}: ReminderHistoryDialogProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && messageId) {
      fetchReminders();
    }
  }, [open, messageId]);

  const fetchReminders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getReminderHistory(messageId);
      setReminders(data || []);
    } catch (err: any) {
      console.error("Error fetching reminders:", err);
      setError(err.message || "Failed to load reminders");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reminder History</DialogTitle>
          <DialogDescription>
            History of reminders sent for this message.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className={`h-6 w-6 animate-spin text-muted-foreground ${ICON_HOVER_EFFECTS.default}`} />
            </div>
          ) : error ? (
            <div className="text-center text-sm text-destructive py-6">
              {error}
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-6">
              No reminders have been sent for this message yet.
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="bg-secondary/30 p-3 rounded-md hover:bg-secondary/40 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-2 items-center mb-2">
                      <Mail className={`h-4 w-4 text-primary ${ICON_HOVER_EFFECTS.default}`} />
                      <span className="text-sm font-medium">
                        Reminder Sent
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(reminder.sent_at)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                    <Clock className={`h-3 w-3 ${ICON_HOVER_EFFECTS.muted}`} />
                    <span>Deadline: {formatDate(reminder.deadline)}</span>
                  </div>
                  
                  {reminder.scheduled_for && (
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                      <Calendar className={`h-3 w-3 ${ICON_HOVER_EFFECTS.muted}`} />
                      <span>Scheduled for: {formatDate(reminder.scheduled_for)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
