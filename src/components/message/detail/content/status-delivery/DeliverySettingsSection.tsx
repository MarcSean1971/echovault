
import React, { useState, useEffect } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { MessageDeliverySettings } from "../../MessageDeliverySettings";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { useScheduledReminders } from "@/hooks/useScheduledReminders";
import { Button } from "@/components/ui/button";
import { AccordionSection } from "@/components/message/detail/AccordionSection";

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
        if (event.detail?.messageId === condition.message_id || event.detail?.conditionId === condition.id) {
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
  const handleManualRefresh = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
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
    <div>
      <AccordionSection
        title={
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center">
              <Clock className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION} ${ICON_HOVER_EFFECTS.muted}`} />
              Delivery Settings
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-7 w-7 rounded-full ${HOVER_TRANSITION}`}
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw 
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} ${HOVER_TRANSITION} ${ICON_HOVER_EFFECTS.muted}`} 
              />
            </Button>
          </div>
        }
        defaultOpen={true}
        className="mt-1"
      >
        <MessageDeliverySettings 
          condition={condition} 
          formatDate={formatDate} 
          renderConditionType={renderConditionType} 
          showInTabs={true} 
        />
      </AccordionSection>
    </div>
  );
}
