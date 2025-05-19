
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
    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center justify-between">
      <div className="flex items-center">
        <Bell className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION} ${ICON_HOVER_EFFECTS.muted}`} />
        Reminder Information
      </div>
      <div className="flex items-center space-x-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onHistoryClick} 
          className={`h-6 px-2 transition-all ${HOVER_TRANSITION}`}
          title="View reminder history"
        >
          <History className={`h-3 w-3 ${ICON_HOVER_EFFECTS.muted}`} />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRefresh} 
          className={`h-6 px-2 transition-all ${HOVER_TRANSITION}`}
          title="Refresh reminder data"
          disabled={isLoading || refreshInProgress}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''} ${ICON_HOVER_EFFECTS.muted}`} />
        </Button>
      </div>
    </h3>
  );
}
