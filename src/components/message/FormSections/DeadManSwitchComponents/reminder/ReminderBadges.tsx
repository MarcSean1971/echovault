
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { formatReminderTime } from "./TimeConversionUtils";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface ReminderBadgesProps {
  reminderMinutes: number[]; // Store as minutes for more precision
  onRemoveReminder: (minutes: number) => void;
}

export function ReminderBadges({ reminderMinutes, onRemoveReminder }: ReminderBadgesProps) {
  if (reminderMinutes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No reminders set
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {reminderMinutes
        .sort((a, b) => b - a) // Sort in descending order for display
        .map((minutes) => (
          <Badge
            key={minutes}
            variant="secondary"
            className={`flex items-center gap-1 py-1 px-2 ${HOVER_TRANSITION}`}
          >
            {formatReminderTime(minutes)} before deadline
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemoveReminder(minutes)}
              className={`h-4 w-4 p-0 rounded-full hover:bg-destructive/20 hover:text-destructive ${HOVER_TRANSITION}`}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove</span>
            </Button>
          </Badge>
        ))}
    </div>
  );
}
