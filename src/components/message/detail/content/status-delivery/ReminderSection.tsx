
import React, { useState, useEffect } from "react";
import { Bell, RefreshCw, History } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { parseReminderMinutes } from "@/utils/reminderUtils";
import { useNextReminders } from "@/hooks/useNextReminders";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { triggerManualReminder } from "@/services/messages/whatsApp/core/reminderService";
import { ReminderHistoryDialog } from "@/components/message/detail/ReminderHistoryDialog";

interface ReminderSectionProps {
  condition: any | null;
  deadline: Date | null;
  isArmed: boolean;
  refreshTrigger?: number;
}

// Interface for the enhanced reminder objects
interface EnhancedReminder {
  formattedShortDate: string;
  formattedText: string;
  isImportant: boolean;
  original: string;
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
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [isTestingReminder, setIsTestingReminder] = useState<boolean>(false);
  
  // Get upcoming reminder information with ability to force refresh
  const { upcomingReminders, hasReminders, isLoading, forceRefresh, lastRefreshed, permissionError } = useNextReminders(
    condition?.message_id,
    refreshTrigger || lastForceRefresh
  );
  
  // Helper function to enhance string reminders with required properties
  const enhanceReminders = (reminders: string[]): EnhancedReminder[] => {
    return reminders.map(reminder => {
      // Extract date and type information from the reminder string
      const isCritical = reminder.toLowerCase().includes('critical');
      const hasTimeInfo = reminder.includes('(');
      
      // Create a short date format from the full reminder text
      let shortDate = reminder;
      if (hasTimeInfo) {
        // Extract the date part before parentheses for short display
        shortDate = reminder.split('(')[0].trim();
      }
      
      return {
        original: reminder,
        formattedShortDate: shortDate,
        formattedText: reminder,
        isImportant: isCritical || reminder.toLowerCase().includes('final delivery')
      };
    });
  };
  
  // Transform string reminders to enhanced objects with required properties
  const enhancedReminders = enhanceReminders(upcomingReminders);
  
  // Handle manual refresh of reminders data
  const handleForceRefresh = () => {
    forceRefresh();
    setLastForceRefresh(Date.now());
    setRefreshCount(prev => prev + 1);
    toast({
      title: "Refreshing reminders data",
      description: "The reminders list is being updated...",
      duration: 2000,
    });
  };
  
  // Handle manual test of reminder delivery
  const handleTestReminder = async () => {
    if (!condition?.message_id) return;
    
    setIsTestingReminder(true);
    try {
      await triggerManualReminder(condition.message_id, true);
      // Force refresh after testing to show the updated state
      setTimeout(() => handleForceRefresh(), 2000);
    } finally {
      setIsTestingReminder(false);
    }
  };
  
  // Listen for condition-updated events to automatically refresh
  useEffect(() => {
    const handleConditionUpdated = (event: Event) => {
      console.log(`[ReminderSection] Received conditions-updated event:`, event);
      
      if (event instanceof CustomEvent) {
        console.log(`[ReminderSection] Event details:`, event.detail);
        
        // Check if this update is relevant to this condition
        const isRelevant = 
          !event.detail?.conditionId || // Global update
          !condition?.id || // We don't have a condition ID to compare
          event.detail?.conditionId === condition.id || // Update for our condition
          event.detail?.messageId === condition.message_id; // Update for our message
          
        if (isRelevant) {
          // Schedule multiple refresh attempts
          // First refresh immediately
          handleForceRefresh();
          
          // Second refresh after a delay
          setTimeout(() => {
            console.log(`[ReminderSection] Performing delayed refresh`);
            handleForceRefresh();
          }, 2000);
          
          // Third refresh after a longer delay 
          setTimeout(() => {
            console.log(`[ReminderSection] Performing final delayed refresh`);
            handleForceRefresh();
          }, 5000);
        }
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    return () => window.removeEventListener('conditions-updated', handleConditionUpdated);
  }, [condition]);
  
  // Listen for external refresh trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log(`[ReminderSection] External refresh trigger changed: ${refreshTrigger}`);
      handleForceRefresh();
    }
  }, [refreshTrigger]);
  
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
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setHistoryOpen(true)} 
            className={`h-6 px-2 transition-all ${HOVER_TRANSITION}`}
            title="View reminder history"
          >
            <History className={`h-3 w-3 ${ICON_HOVER_EFFECTS.muted}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleForceRefresh} 
            className={`h-6 px-2 transition-all ${HOVER_TRANSITION}`}
            title="Refresh reminder data"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''} ${ICON_HOVER_EFFECTS.muted}`} />
          </Button>
        </div>
      </h3>
      <div className="space-y-3 text-sm">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-1">
            <span className="font-medium">Status:</span>
            <span className="col-span-2 text-muted-foreground italic">Loading reminder information...</span>
          </div>
        ) : permissionError ? (
          <div className="grid grid-cols-3 gap-1">
            <span className="font-medium">Status:</span>
            <span className="col-span-2 text-amber-600 italic">
              You don't have permission to view reminders for this message.
            </span>
          </div>
        ) : hasReminders ? (
          <>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-medium">Status:</span>
              <span className="col-span-2">
                {enhancedReminders.length > 0 
                  ? `${enhancedReminders.length} upcoming reminder${enhancedReminders.length !== 1 ? 's' : ''}` 
                  : "All reminders sent"}
              </span>
            </div>
            {enhancedReminders.length > 0 && (
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium">Next reminders:</span>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {enhancedReminders.map((reminder, index) => (
                    <span 
                      key={index} 
                      className={`inline-block px-2 py-1 ${
                        reminder.isImportant 
                          ? "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100" 
                          : "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                      } rounded-md text-xs transition-colors ${HOVER_TRANSITION}`}
                      title={reminder.formattedText}
                    >
                      {reminder.formattedShortDate}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestReminder}
                disabled={isTestingReminder}
                className={`w-full text-xs ${HOVER_TRANSITION}`}
              >
                {isTestingReminder ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Testing reminder delivery...
                  </>
                ) : (
                  "Test Reminder Delivery"
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            <span className="font-medium">Status:</span>
            <span className="col-span-2 text-muted-foreground italic">
              {refreshCount > 3 
                ? "No reminders found. Try checking in again."
                : "No reminders configured"}
            </span>
          </div>
        )}
        {/* Show configured reminder times */}
        {reminderMinutes && reminderMinutes.length > 0 && (
          <div className="grid grid-cols-3 gap-1 mt-2">
            <span className="font-medium">Configured times:</span>
            <div className="col-span-2 flex flex-wrap gap-1">
              {reminderMinutes.sort((a, b) => b - a).map((minute, index) => (
                <span
                  key={index}
                  className={`inline-block px-2 py-1 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-md text-xs ${HOVER_TRANSITION}`}
                  title={`Reminder scheduled ${minute} minutes before deadline`}
                >
                  {minute >= 60 ? `${(minute / 60).toFixed(1)}h` : `${minute}m`}
                </span>
              ))}
            </div>
          </div>
        )}
        {/* Show debug info in dev environment */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 border-t pt-2 text-xs text-muted-foreground">
            <div>Message ID: {condition?.message_id}</div>
            <div>Condition ID: {condition?.id}</div>
            <div>Last refreshed: {new Date(lastRefreshed || 0).toLocaleTimeString()}</div>
            <div>Refresh count: {refreshCount}</div>
            <div>Reminder minutes: {JSON.stringify(reminderMinutes)}</div>
            {permissionError && <div className="text-amber-600">Permission error detected</div>}
          </div>
        )}
      </div>
      
      {/* Reminder History Dialog */}
      {condition?.message_id && (
        <ReminderHistoryDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          messageId={condition.message_id}
        />
      )}
    </>
  );
}
