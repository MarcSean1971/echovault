
import { MessageTimer } from "@/components/message/MessageTimer";
import { cn } from "@/lib/utils";
import { AlertCircle, Clock } from "lucide-react";

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
  
  return (
    <div className={cn(
      "rounded-md p-3 transition-all duration-300",
      isExpired ? "bg-destructive/10 border border-destructive" :
      isVeryUrgent ? "bg-destructive/5 border border-destructive/50" : 
      isUrgent ? "bg-orange-500/5 border border-orange-500/30" : 
      "bg-amber-400/5 border border-amber-400/20"
    )}>
      <p className={cn(
        "text-sm font-medium mb-2 flex items-center gap-1.5",
        isExpired ? "text-destructive" : 
        isVeryUrgent ? "text-destructive" : 
        isUrgent ? "text-orange-500" : 
        "text-amber-500"
      )}>
        {isExpired || isVeryUrgent ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
        {isExpired ? "Delivery imminent" : 
         isVeryUrgent ? "Critical countdown" : 
         isUrgent ? "Urgent countdown" : "Delivery countdown"}
      </p>
      <MessageTimer deadline={deadline} isArmed={isArmed} />
    </div>
  );
}
