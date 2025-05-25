
import { useState, useEffect } from "react";
import { getUpcomingReminders } from "@/services/reminders/simpleReminderService";

/**
 * SIMPLIFIED: Hook to get upcoming reminders for a message
 */
export function useSimpleReminders(messageId: string, refreshTrigger?: number) {
  const [upcomingReminders, setUpcomingReminders] = useState<string[]>([]);
  const [hasReminders, setHasReminders] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!messageId) return;

    const fetchReminders = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getUpcomingReminders(messageId);
        setUpcomingReminders(result.upcomingReminders);
        setHasReminders(result.hasReminders);
      } catch (err: any) {
        console.error("[SIMPLE-REMINDERS] Error fetching reminders:", err);
        setError(err.message || "Failed to fetch reminders");
        setUpcomingReminders([]);
        setHasReminders(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminders();
  }, [messageId, refreshTrigger]);

  return {
    upcomingReminders,
    hasReminders,
    isLoading,
    error
  };
}
