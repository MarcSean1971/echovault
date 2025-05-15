
import { MessageTimer } from "@/components/message/MessageTimer";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
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
  const [deliveryAttempted, setDeliveryAttempted] = useState<boolean>(false);
  const [deliverySuccess, setDeliverySuccess] = useState<boolean>(false);
  const [isDelivering, setIsDelivering] = useState<boolean>(false);

  // Reset state when refreshTrigger changes
  useEffect(() => {
    setDeliveryAttempted(false);
    setDeliverySuccess(false);
  }, [refreshTrigger]);
  
  // Don't render anything if not armed or no deadline
  if (!isArmed || !deadline) return null;
  
  // Calculate time left to determine urgency for styling
  const timeLeft = deadline ? deadline.getTime() - new Date().getTime() : 0;
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const isUrgent = hours < 1 && timeLeft > 0;
  const isVeryUrgent = timeLeft < 10 * 60 * 1000 && timeLeft > 0; // Less than 10 minutes
  
  // Handle when deadline is reached directly
  const handleDeadlineReached = async () => {
    if (deliveryAttempted || !onForceDelivery) return;
    
    console.log('[MobileTimerAlert] Deadline reached callback triggered!');
    setIsExpired(true);
    setDeliveryAttempted(true);
    setIsDelivering(true);
    
    try {
      await onForceDelivery();
      console.log('[MobileTimerAlert] Message delivery successful');
      setDeliverySuccess(true);
    } catch (error) {
      console.error('[MobileTimerAlert] Message delivery failed:', error);
    } finally {
      setIsDelivering(false);
    }
  };
  
  // Handle force delivery button click
  const handleForceDeliveryClick = async () => {
    if (!onForceDelivery || isDelivering) return;
    
    setIsDelivering(true);
    setDeliveryAttempted(true);
    
    try {
      await onForceDelivery();
      setDeliverySuccess(true);
    } catch (error) {
      console.error('[MobileTimerAlert] Force delivery failed:', error);
    } finally {
      setIsDelivering(false);
    }
  };
  
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
              {deliveryAttempted ? (deliverySuccess ? "Delivery successful" : "Delivery attempted") : title}
            </StatusBadge>
          </div>
          
          {!deliveryAttempted && onForceDelivery && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleForceDeliveryClick}
              disabled={isDelivering}
              className={cn(
                "text-xs bg-destructive/10 border-destructive/50 hover:bg-destructive/20",
                HOVER_TRANSITION
              )}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isDelivering ? "animate-spin" : ""} ${HOVER_TRANSITION}`} />
              Force Delivery
            </Button>
          )}
          
          {deliveryAttempted && deliverySuccess && (
            <div className="flex items-center text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span>Delivered</span>
            </div>
          )}
        </div>
        
        <AlertDescription className="pt-1">
          <MessageTimer 
            deadline={deadline} 
            isArmed={isArmed} 
            refreshTrigger={refreshTrigger}
            onDeadlineReached={handleDeadlineReached}
          />
          
          {isExpired && (
            <div className="mt-2 flex items-center text-xs text-destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>
                {deliveryAttempted 
                  ? deliverySuccess 
                    ? "Message has been delivered successfully." 
                    : "Delivery has been attempted. Checking status..." 
                  : "Deadline has passed. Delivering message..."}
              </span>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
