
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatReminderTime } from "./TimeConversionUtils";
import { X } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface ReminderBadgesProps {
  reminderMinutes: number[];
  onRemoveReminder: (minutes: number) => void;
}

export function ReminderBadges({ reminderMinutes, onRemoveReminder }: ReminderBadgesProps) {
  if (reminderMinutes.length === 0) {
    return null;
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {reminderMinutes.map(minutes => (
        <Badge 
          key={minutes} 
          variant="secondary" 
          className="flex items-center gap-1 hover:bg-slate-200 transition-colors duration-200"
        >
          {formatReminderTime(minutes)} before
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-5 w-5 p-0 hover:bg-muted/80 ${HOVER_TRANSITION}`}
            onClick={() => onRemoveReminder(minutes)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}
