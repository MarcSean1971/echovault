
import { MessageTimer } from "@/components/message/MessageTimer";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface DesktopTimerAlertProps {
  deadline: Date | null;
  isArmed: boolean;
}

export function DesktopTimerAlert({ deadline, isArmed }: DesktopTimerAlertProps) {
  if (!isArmed || !deadline) return null;
  
  // Calculate time left to determine urgency for styling
  const timeLeft = deadline ? deadline.getTime() - new Date().getTime() : 0;
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const isUrgent = hours < 1 && timeLeft > 0;
  const isVeryUrgent = timeLeft < 10 * 60 * 1000 && timeLeft > 0; // Less than 10 minutes
  const isExpired = timeLeft <= 0;
  
  // Determine status for our badge
  const status = isExpired ? "critical" : isVeryUrgent ? "critical" : isUrgent ? "warning" : "armed";
  const title = isExpired ? "Delivery imminent" : 
               isVeryUrgent ? "Critical countdown" : 
               isUrgent ? "Urgent countdown" : "Delivery countdown";
  
  return (
    <div className={cn(
      "rounded-md p-3 transition-all duration-300",
      isExpired ? "bg-destructive/10 border border-destructive" :
      isVeryUrgent ? "bg-destructive/5 border border-destructive/50" : 
      isUrgent ? "bg-orange-500/5 border border-orange-500/30" : 
      "bg-amber-400/5 border border-amber-400/20"
    )}>
      <div className="mb-2">
        <StatusBadge 
          status={status}
          pulseAnimation={isVeryUrgent}
          className="font-medium"
        >
          {title}
        </StatusBadge>
      </div>
      <MessageTimer deadline={deadline} isArmed={isArmed} />
    </div>
  );
}
