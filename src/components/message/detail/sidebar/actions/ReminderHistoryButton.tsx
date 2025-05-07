
import { Clock } from "lucide-react";
import { ActionButton } from "./ActionButton";

interface ReminderHistoryButtonProps {
  onViewReminderHistory: () => void;
  isActionLoading: boolean;
}

export function ReminderHistoryButton({
  onViewReminderHistory,
  isActionLoading
}: ReminderHistoryButtonProps) {
  return (
    <ActionButton
      icon={Clock}
      label="View Reminder History"
      onClick={onViewReminderHistory}
      disabled={isActionLoading}
    />
  );
}
