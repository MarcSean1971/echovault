
import React, { useState, useEffect } from "react";
import { Bell, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { parseReminderMinutes } from "@/utils/reminderUtils";
import { useNextReminders } from "@/hooks/useNextReminders";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface ReminderSectionProps {
  condition: any | null;
  deadline: Date | null;
  isArmed: boolean;
  refreshTrigger?: number;
}

export function ReminderSection({ 
  condition, 
  deadline, 
  isArmed,
  refreshTrigger 
}: ReminderSectionProps) {
  // Parse reminder minutes from the condition
  const reminderMinutes = parseReminderMinutes(condition?.reminder_hours);
  
  // State to track when the last force refresh happened
  const [lastForceRefresh, setLastForceRefresh] = useState<number>(0);
  
  // Get upcoming reminder information with ability to force refresh
  const { upcomingReminders, hasReminders, forceRefresh, lastRefreshed } = useNextReminders(
    condition?.message_id,
    refreshTrigger || lastForceRefresh
  );
  
  // Handle manual refresh of reminders data
  const handleForceRefresh = () => {
    forceRefresh();
    setLastForceRefresh(Date.now());
    toast({
      title: "Refreshing reminders data",
      description: "The reminders list is being updated...",
      duration: 2000,
    });
  };
  
  // Listen for condition-updated events to automatically refresh
  useEffect(() => {
    const handleConditionUpdated = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.reminderResults) {
        console.log(`[ReminderSection] Received conditions-updated event with reminder results:`, event.detail.reminderResults);
        handleForceRefresh();
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    return () => window.removeEventListener('conditions-updated', handleConditionUpdated);
  }, []);
  
  if (!isArmed) {
    return null;
  }

  return (
    <>
      <Separator className="mb-3" />
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center justify-between">
        <div className="flex items-center">
          <Bell className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION} ${ICON_HOVER_EFFECTS.muted}`} />
          Reminder Information
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleForceRefresh} 
          className="h-6 px-2"
          title="Refresh reminder data"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </h3>
      <div className="space-y-3 text-sm">
        {hasReminders ? (
          <>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-medium">Status:</span>
              <span className="col-span-2">
                {upcomingReminders.length > 0 
                  ? `${upcomingReminders.length} upcoming reminder${upcomingReminders.length !== 1 ? 's' : ''}` 
                  : "All reminders sent"}
              </span>
            </div>
            {upcomingReminders.length > 0 && (
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium">Next reminders:</span>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {upcomingReminders.map((reminder, index) => (
                    <span 
                      key={index} 
                      className={`inline-block px-2 py-1 ${
                        reminder.isImportant 
                          ? "bg-red-50 border border-red-200 text-red-700" 
                          : "bg-amber-50 border border-amber-200 text-amber-700"
                      } rounded-md text-xs hover:bg-amber-100 transition-colors`}
                      title={reminder.formattedText}
                    >
                      {reminder.formattedShortDate}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            <span className="font-medium">Status:</span>
            <span className="col-span-2 text-muted-foreground italic">No reminders configured</span>
          </div>
        )}
        {/* Show debug info in dev environment */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 border-t pt-2 text-xs text-muted-foreground">
            <div>Message ID: {condition?.message_id}</div>
            <div>Condition ID: {condition?.id}</div>
            <div>Last refreshed: {new Date(lastRefreshed || 0).toLocaleTimeString()}</div>
          </div>
        )}
      </div>
    </>
  );
}
