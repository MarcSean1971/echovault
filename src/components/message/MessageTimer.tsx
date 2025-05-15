
import { Clock, AlertCircle, TimerOff } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";
import { getTimerColor, getPulseClass } from "@/utils/timerUtils";

interface MessageTimerProps {
  deadline: Date | null;
  isArmed: boolean;
  refreshTrigger?: number;
  onDeadlineReached?: () => void; // Add callback for direct delivery trigger
}

export function MessageTimer({ deadline, isArmed, refreshTrigger, onDeadlineReached }: MessageTimerProps) {
  const isMobile = useIsMobile();
  const { timeLeft, timePercentage, isUrgent, isVeryUrgent, hasReachedZero } = useCountdownTimer({
    deadline,
    isArmed,
    refreshTrigger,
    onDeadlineReached // Pass the callback to the hook
  });
  
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
        isArmed && isVeryUrgent ? getPulseClass(isArmed, isUrgent, isVeryUrgent) : '',
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
            getTimerColor(isArmed, timePercentage, isUrgent, isVeryUrgent),
            isArmed && isVeryUrgent ? 'animate-pulse' : '',
            HOVER_TRANSITION
          )}
          style={{ width: isArmed ? `${timePercentage}%` : '100%' }}
        ></div>
      </div>
    </div>
  );
}
