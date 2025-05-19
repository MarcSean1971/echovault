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
  return <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center justify-between">
      <div className="flex items-center">
        <Bell className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION} ${ICON_HOVER_EFFECTS.muted}`} />
        Reminder Information
      </div>
      
    </h3>;
}