
import { MessageTimer } from "@/components/message/MessageTimer";
import { AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface MobileTimerAlertProps {
  deadline: Date | null;
  isArmed: boolean;
}

export function MobileTimerAlert({ deadline, isArmed }: MobileTimerAlertProps) {
  if (!isArmed || !deadline) return null;
  
  // Calculate time left to determine urgency for styling
  const timeLeft = deadline ? deadline.getTime() - new Date().getTime() : 0;
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const isUrgent = hours < 1 && timeLeft > 0;
  const isVeryUrgent = timeLeft < 10 * 60 * 1000 && timeLeft > 0; // Less than 10 minutes
  const isExpired = timeLeft <= 0;
  
  return (
    <div className="col-span-full">
      <Alert 
        variant={isExpired ? "destructive" : isVeryUrgent ? "destructive" : "default"}
        className={cn(
          "border transition-all duration-300",
          isExpired ? "bg-destructive/10 border-destructive" :
          isVeryUrgent ? "bg-destructive/5 border-destructive" : 
          isUrgent ? "bg-orange-500/5 border-orange-500" : 
          "bg-amber-400/5 border-amber-400/50"
        )}
      >
        <div className={cn("flex items-center gap-2 mb-2", isVeryUrgent && "animate-pulse")}>
          {isExpired || isVeryUrgent ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          <AlertTitle className={cn(
            isExpired ? "text-destructive" : 
            isVeryUrgent ? "text-destructive" : 
            isUrgent ? "text-orange-500" : ""
          )}>
            {isExpired ? "Delivery imminent" : 
             isVeryUrgent ? "Critical countdown" : 
             isUrgent ? "Urgent countdown" : "Delivery countdown"}
          </AlertTitle>
        </div>
        <AlertDescription className="pt-1">
          <MessageTimer deadline={deadline} isArmed={isArmed} />
        </AlertDescription>
      </Alert>
    </div>
  );
}
