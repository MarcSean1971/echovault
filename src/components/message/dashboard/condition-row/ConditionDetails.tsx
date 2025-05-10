
import { formatDistanceToNow } from "date-fns";

interface ConditionDetailsProps {
  triggerType: string;
  nextDeadline?: string | null;
}

export function ConditionDetails({ triggerType, nextDeadline }: ConditionDetailsProps) {
  // Format the condition type for display
  const getConditionTypeDisplay = (): string => {
    switch (triggerType) {
      case "no_check_in":
        return "Deadman's switch";
      case "panic_button":
        return "Panic button";
      case "scheduled":
        return "Scheduled message";
      case "manual_trigger":
        return "Manual trigger";
      case "panic_trigger":
        return "Panic trigger";
      default:
        return triggerType;
    }
  };
  
  // Get deadline display for the condition
  const getDeadlineDisplay = (): string => {
    if (!nextDeadline) {
      return "—";
    }
    
    try {
      return formatDistanceToNow(new Date(nextDeadline), { addSuffix: true });
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <>
      <div className="col-span-2 text-sm">
        {getConditionTypeDisplay()}
      </div>
      
      <div className="col-span-2 text-sm">
        {getDeadlineDisplay()}
      </div>
    </>
  );
}
