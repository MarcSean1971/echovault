
import React from "react";
import { Bell, History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface ReminderHeaderProps {
  onRefresh: () => void;
  onHistoryClick: () => void;
  isLoading: boolean;
  refreshInProgress: boolean;
}

export function ReminderHeader({
  onRefresh,
  onHistoryClick,
  isLoading,
  refreshInProgress
}: ReminderHeaderProps) {
  return (
    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center justify-between">
      <div className="flex items-center">
        <Bell className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION} ${ICON_HOVER_EFFECTS.muted}`} />
        Reminder Information
      </div>
      
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-full ${HOVER_TRANSITION}`}
          onClick={onRefresh}
          disabled={refreshInProgress || isLoading}
          title="Refresh reminders"
        >
          <RefreshCw 
            className={`h-4 w-4 ${refreshInProgress ? 'animate-spin' : ''} ${HOVER_TRANSITION} ${ICON_HOVER_EFFECTS.muted}`} 
          />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-full ${HOVER_TRANSITION}`}
          onClick={onHistoryClick}
          title="View reminder history"
        >
          <History className={`h-4 w-4 ${HOVER_TRANSITION} ${ICON_HOVER_EFFECTS.muted}`} />
        </Button>
      </div>
    </h3>
  );
}
