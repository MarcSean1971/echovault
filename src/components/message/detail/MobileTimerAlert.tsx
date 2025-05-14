
import { MessageTimer } from "@/components/message/MessageTimer";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MobileTimerAlertProps {
  deadline: Date | null;
  isArmed: boolean;
  refreshTrigger?: number;
  onForceDelivery?: () => Promise<void>;
}

export function MobileTimerAlert({ 
  deadline, 
  isArmed, 
  refreshTrigger,
  onForceDelivery
}: MobileTimerAlertProps) {
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [showRetryButton, setShowRetryButton] = useState<boolean>(false);

  if (!isArmed || !deadline) return null;
  
  // Calculate time left to determine urgency for styling
  const timeLeft = deadline ? deadline.getTime() - new Date().getTime() : 0;
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const isUrgent = hours < 1 && timeLeft > 0;
  const isVeryUrgent = timeLeft < 10 * 60 * 1000 && timeLeft > 0; // Less than 10 minutes
  
  // Check for expired status
  useEffect(() => {
    const checkExpiration = () => {
      if (deadline) {
        const now = new Date().getTime();
        const deadlineTime = deadline.getTime();
        const hasExpired = now > deadlineTime;
        
        setIsExpired(hasExpired);
        
        // If expired for more than 30 seconds without delivery, show retry button
        if (hasExpired && (now - deadlineTime) > 30000) {
          setShowRetryButton(true);
        }
      }
    };
    
    // Check immediately
    checkExpiration();
    
    // Set up interval to check every second
    const interval = setInterval(checkExpiration, 1000);
    
    return () => clearInterval(interval);
  }, [deadline, refreshTrigger]);
  
  // Determine status for our badge
  const status = isExpired ? "critical" : isVeryUrgent ? "critical" : isUrgent ? "warning" : "armed";
  const title = isExpired ? "Delivery imminent" : 
               isVeryUrgent ? "Critical countdown" : 
               isUrgent ? "Urgent countdown" : "Delivery countdown";
  
  return (
    <div className="col-span-full">
      <Alert 
        variant={isExpired || isVeryUrgent ? "destructive" : "default"}
        className={cn(
          "border transition-all duration-300",
          isExpired ? "bg-destructive/10 border-destructive" :
          isVeryUrgent ? "bg-destructive/5 border-destructive" : 
          isUrgent ? "bg-orange-500/5 border-orange-500" : 
          "bg-amber-400/5 border-amber-400/50"
        )}
      >
        <div className={cn("flex items-center justify-between mb-2")}>
          <div className="flex items-center gap-2">
            <StatusBadge 
              status={status as "armed" | "panic" | "disarmed" | "pending" | "warning" | "critical"}
              pulseAnimation={isVeryUrgent || isExpired}
              className="font-medium"
            >
              {title}
            </StatusBadge>
          </div>
          
          {showRetryButton && onForceDelivery && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onForceDelivery}
              className={cn(
                "text-xs bg-destructive/10 border-destructive/50 hover:bg-destructive/20",
                HOVER_TRANSITION
              )}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${HOVER_TRANSITION}`} />
              Force Delivery
            </Button>
          )}
        </div>
        
        <AlertDescription className="pt-1">
          <MessageTimer 
            deadline={deadline} 
            isArmed={isArmed} 
            refreshTrigger={refreshTrigger}
          />
          
          {isExpired && (
            <div className="mt-2 flex items-center text-xs text-destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>
                Deadline has passed. Message delivery should occur shortly.
                {showRetryButton && " If not received, use the Force Delivery button."}
              </span>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
