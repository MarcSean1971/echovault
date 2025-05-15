
import { Clock, AlertCircle, TimerOff } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface MessageTimerProps {
  deadline: Date | null;
  isArmed: boolean;
  messageId?: string; // Add messageId prop to trigger deadman's switch
  refreshTrigger?: number;
}

export function MessageTimer({ deadline, isArmed, messageId, refreshTrigger }: MessageTimerProps) {
  const isMobile = useIsMobile();
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");
  const [timePercentage, setTimePercentage] = useState(100);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isVeryUrgent, setIsVeryUrgent] = useState(false);
  const [hasReachedZero, setHasReachedZero] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryAttempted, setDeliveryAttempted] = useState(false);
  
  // Check local storage on mount to see if delivery was already attempted for this message/deadline
  useEffect(() => {
    if (messageId && deadline) {
      const storageKey = `deadman_delivery_${messageId}_${deadline.getTime()}`;
      const wasAttempted = localStorage.getItem(storageKey) === 'true';
      setDeliveryAttempted(wasAttempted);
      
      // Clean up any old delivery records (older than 1 day)
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('deadman_delivery_')) {
            // Extract timestamp from key
            const parts = key.split('_');
            const timestamp = parseInt(parts[parts.length - 1]);
            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;
            
            // Remove if older than 1 day
            if (now - timestamp > oneDayMs) {
              localStorage.removeItem(key);
            }
          }
        }
      } catch (e) {
        // Ignore errors in cleanup
        console.error("Error cleaning up old delivery records:", e);
      }
    }
  }, [messageId, deadline]);
  
  // Trigger deadman's switch when deadline is reached
  const triggerDeadmanSwitch = async () => {
    if (!messageId || !isArmed || deliveryAttempted) return;
    
    try {
      console.log(`[MessageTimer] Triggering deadman's switch for message ${messageId}`);
      setIsDelivering(true);
      
      // Mark as attempted immediately to prevent duplicate calls
      if (messageId && deadline) {
        const storageKey = `deadman_delivery_${messageId}_${deadline.getTime()}`;
        localStorage.setItem(storageKey, 'true');
        setDeliveryAttempted(true);
      }
      
      // Call the dedicated edge function
      const { data, error } = await supabase.functions.invoke('deadman-switch-trigger', {
        body: { messageId }
      });
      
      if (error) {
        console.error('[MessageTimer] Error triggering deadman switch:', error);
        toast({
          title: "Delivery Error",
          description: "Failed to deliver message. Please check your connection and try again.",
          variant: "destructive",
        });
        
        // Retry once after a delay
        setTimeout(async () => {
          try {
            const { data: retryData, error: retryError } = await supabase.functions.invoke('deadman-switch-trigger', {
              body: { messageId }
            });
            
            if (!retryError) {
              toast({
                title: "Delivery Successful",
                description: "Message has been delivered on retry attempt.",
              });
              
              // Dispatch event to refresh UI
              window.dispatchEvent(new CustomEvent('message-delivered', { 
                detail: { messageId, deliveredAt: new Date().toISOString() }
              }));
            }
          } catch (retryErr) {
            console.error('[MessageTimer] Retry failed:', retryErr);
          } finally {
            setIsDelivering(false);
          }
        }, 5000);
      } else {
        console.log('[MessageTimer] Deadman switch triggered successfully:', data);
        toast({
          title: "Message Delivered",
          description: "Your message has been delivered to all recipients.",
        });
        
        // Dispatch event to refresh UI
        window.dispatchEvent(new CustomEvent('message-delivered', { 
          detail: { messageId, deliveredAt: new Date().toISOString() }
        }));
        setIsDelivering(false);
      }
    } catch (error) {
      console.error('[MessageTimer] Error:', error);
      setIsDelivering(false);
    }
  };

  useEffect(() => {
    if (!deadline || !isArmed) {
      setTimeLeft("--:--:--");
      setIsUrgent(false);
      setIsVeryUrgent(false);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();
      
      if (difference <= 0) {
        setIsUrgent(true);
        setIsVeryUrgent(true);
        setHasReachedZero(true);
        
        // Only trigger if we have a messageId, are armed, and haven't delivered yet
        if (messageId && isArmed && !deliveryAttempted && !isDelivering) {
          triggerDeadmanSwitch();
        }
        
        return "00:00:00";
      }
      
      // Calculate hours, minutes, seconds
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      // Check if urgent (less than 1 hour)
      setIsUrgent(hours === 0);
      // Check if very urgent (less than 10 minutes)
      setIsVeryUrgent(hours === 0 && minutes < 10);
      
      // Format the time
      return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');
    };

    const calculatePercentage = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();
      
      if (difference <= 0) return 0;
      
      // Assume a default 24 hour period if we don't know the start time
      const totalPeriod = 24 * 60 * 60 * 1000; // 24 hours in ms
      return Math.min(100, Math.max(0, (difference / totalPeriod) * 100));
    };
    
    // Check immediately on mount if deadline already passed
    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);
    setTimePercentage(calculatePercentage());
    
    // Set up interval to update every second
    const intervalId = window.setInterval(() => {
      setTimeLeft(calculateTimeLeft());
      setTimePercentage(calculatePercentage());
    }, 1000);
    
    return () => window.clearInterval(intervalId);
  }, [deadline, isArmed, refreshTrigger, messageId, deliveryAttempted, isDelivering]);

  // Helper functions for styling
  const getTimerColor = () => {
    if (!isArmed) return 'bg-gray-300';
    if (timePercentage < 10 || isVeryUrgent) return 'bg-destructive';
    if (timePercentage < 30 || isUrgent) return 'bg-orange-500';
    if (timePercentage < 60) return 'bg-amber-400';
    return 'bg-green-500';
  };
  
  const getPulseClass = () => {
    if (!isArmed) return '';
    if (isVeryUrgent) return 'animate-[pulse_1s_cubic-bezier(0.4,0,0.6,1)_infinite]';
    if (isUrgent) return 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]';
    return '';
  };
  
  return (
    <div className={cn(
      "space-y-2 p-2 rounded-lg", 
      isMobile ? 'px-1' : '',
      isArmed ? (
        isVeryUrgent ? 'bg-destructive/5' : 
        isUrgent ? 'bg-orange-50' : 
        'bg-green-50'
      ) : 'bg-muted/30',
      HOVER_TRANSITION
    )}>
      <div className={cn(
        "flex items-center justify-between transition-colors duration-300",
        isArmed ? (
          isVeryUrgent ? 'text-destructive' : isUrgent ? 'text-orange-500' : 'text-destructive/80'
        ) : 'text-muted-foreground',
        isArmed && isVeryUrgent ? getPulseClass() : '',
        HOVER_TRANSITION
      )}>
        <div className="flex items-center">
          {isArmed ? (
            isVeryUrgent ? (
              <AlertCircle className={`h-5 w-5 mr-1.5 ${HOVER_TRANSITION}`} />
            ) : (
              <Clock className={`h-5 w-5 mr-1.5 ${HOVER_TRANSITION}`} />
            )
          ) : (
            <TimerOff className={`h-5 w-5 mr-1.5 ${HOVER_TRANSITION}`} />
          )}
          <span className={cn(
            "font-mono text-lg transition-all duration-300",
            isArmed ? (
              isVeryUrgent ? 'font-bold' : isUrgent ? 'font-semibold' : 'font-medium'
            ) : 'font-normal',
            HOVER_TRANSITION
          )}>
            {timeLeft}
          </span>
        </div>
        
        {!isMobile && (
          <div className={cn(
            "text-xs transition-colors duration-300",
            isArmed ? (
              isVeryUrgent ? 'text-destructive font-medium' : 'text-muted-foreground'
            ) : 'text-muted-foreground',
            HOVER_TRANSITION
          )}>
            {isArmed ? (isVeryUrgent ? 'Critical' : isUrgent ? 'Urgent' : '') : 'Disarmed'}
          </div>
        )}
      </div>
      
      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
        <div 
          className={cn(
            "h-2.5 rounded-full transition-all duration-500",
            getTimerColor(),
            isArmed && isVeryUrgent ? 'animate-pulse' : '',
            HOVER_TRANSITION
          )}
          style={{ width: isArmed ? `${timePercentage}%` : '100%' }}
        ></div>
      </div>
      
      {isDelivering && (
        <div className="text-xs text-center font-medium text-amber-600 animate-pulse">
          Delivering message...
        </div>
      )}
      
      {deliveryAttempted && !isDelivering && (
        <div className="text-xs text-center font-medium text-green-600">
          Message delivery initiated
        </div>
      )}
    </div>
  );
}
