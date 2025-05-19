
import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { MessageDeliverySettings } from "../../MessageDeliverySettings";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { useScheduledReminders } from "@/hooks/useScheduledReminders";
import { parseReminderMinutes } from "@/utils/reminderUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DeliverySettingsSectionProps {
  condition: any | null;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  deadline?: Date | null;
  isArmed?: boolean;
  refreshTrigger?: number;
  onFormattedRemindersChange?: (reminders: string[]) => void;
}

export function DeliverySettingsSection({
  condition,
  formatDate,
  renderConditionType,
  deadline,
  isArmed = false,
  refreshTrigger,
  onFormattedRemindersChange
}: DeliverySettingsSectionProps) {
  // Local refresh counter to force updates when needed
  const [localRefresh, setLocalRefresh] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Listen for condition updates to refresh scheduled reminders
  useEffect(() => {
    const handleConditionUpdated = (event: Event) => {
      if (event instanceof CustomEvent && condition) {
        // Check if this update is relevant to this condition
        if (
          (event.detail?.messageId === condition.message_id) || 
          (event.detail?.conditionId === condition.id)
        ) {
          console.log('[DeliverySettingsSection] Received condition update event, refreshing scheduled reminders');
          // Update localRefresh to trigger a re-fetch
          setLocalRefresh(prev => prev + 1);
        }
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionUpdated);
    };
  }, [condition]);
  
  // Force refresh when component mounts to ensure we have the latest data
  useEffect(() => {
    console.log('[DeliverySettingsSection] Component mounted, setting initial refresh');
    setLocalRefresh(prev => prev + 1);
  }, []);
  
  // Combine external and local refresh triggers
  const combinedRefreshTrigger = refreshTrigger ? refreshTrigger + localRefresh : localRefresh;

  if (!condition) {
    return null;
  }

  // Handler for manual refresh button
  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    console.log('[DeliverySettingsSection] Manual refresh requested');
    
    try {
      // Simulate a slight delay for user feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update localRefresh to trigger a re-fetch
      setLocalRefresh(prev => prev + 1);
      
      // Dispatch a global event to ensure all components refresh
      window.dispatchEvent(new CustomEvent('conditions-updated', { 
        detail: { 
          conditionId: condition.id,
          messageId: condition.message_id,
          updatedAt: new Date().toISOString(),
          triggerValue: Date.now(),
          source: 'manual-refresh'
        }
      }));
    } catch (error) {
      console.error('[DeliverySettingsSection] Error during manual refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Use the scheduled reminders hook to get information about all scheduled reminders
  const {
    isLoading,
    upcomingReminders: formattedAllReminders,
    hasSchedule,
    lastRefreshed,
    forceRefresh
  } = useScheduledReminders(condition.message_id, combinedRefreshTrigger);
  
  // Pass the formatted reminders up to the parent component
  useEffect(() => {
    if (onFormattedRemindersChange && formattedAllReminders) {
      onFormattedRemindersChange(formattedAllReminders);
    }
  }, [formattedAllReminders, onFormattedRemindersChange]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center">
          <Clock className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION} ${ICON_HOVER_EFFECTS.muted}`} />
          Delivery Settings
        </h3>
        
        {/* Add refresh button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleManualRefresh} 
          disabled={isRefreshing}
          className="h-7 px-2"
        >
          <RefreshCw 
            className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
          <span className="text-xs">Refresh</span>
        </Button>
      </div>
      
      <MessageDeliverySettings 
        condition={condition}
        formatDate={formatDate}
        renderConditionType={renderConditionType}
        showInTabs={true}
      />
      
      {/* Add scheduled reminders display */}
      {!isLoading && (
        <div className="bg-muted/30 rounded-md p-3 text-sm mt-2">
          <h4 className="font-medium mb-1 flex items-center justify-between">
            <span>Scheduled Events</span>
            {isArmed && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>}
            {!isArmed && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Inactive</Badge>}
          </h4>
          
          {/* Removed the ul element which is now in ReminderSection */}
          {formattedAllReminders.length === 0 && (
            <p className="text-muted-foreground italic">
              {isArmed ? 
                "No scheduled reminders found. They may have been already sent or not configured." :
                "Message is not armed. Reminders will be scheduled when the message is armed."
              }
            </p>
          )}
          
          {/* Info text about unified scheduling system */}
          <p className="text-xs text-muted-foreground mt-3 italic">
            All reminders and final delivery are scheduled through our reliable delivery system
            with multiple fallbacks for critical messages.
          </p>
          
          {/* Show last refresh timestamp */}
          {lastRefreshed && (
            <p className="text-xs text-muted-foreground mt-1 text-right">
              Last updated: {new Date(lastRefreshed).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
