
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { cn } from "@/lib/utils";

interface DelayedUnlockProps {
  unlockTime: Date;
  onUnlock: () => void;
}

export const DelayedUnlock = ({ unlockTime, onUnlock }: DelayedUnlockProps) => {
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(100);

  // Format remaining time
  const formatRemainingTime = (): string => {
    const now = new Date();
    const diffMs = unlockTime.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      onUnlock();
      return '';
    }
    
    // Calculate time components
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage
  const calculateProgress = (): number => {
    const now = new Date();
    const currentMs = now.getTime();
    const unlockMs = unlockTime.getTime();
    const startMs = unlockMs - (15 * 60 * 1000); // Assume 15 min total countdown
    
    if (currentMs >= unlockMs) return 0;
    if (currentMs <= startMs) return 100;
    
    const elapsed = unlockMs - currentMs;
    const total = unlockMs - startMs;
    return Math.round((elapsed / total) * 100);
  };
  
  // Update countdown timer
  useEffect(() => {
    const intervalId = setInterval(() => {
      const formattedTime = formatRemainingTime();
      setRemainingTime(formattedTime);
      setProgressPercent(calculateProgress());
    }, 1000); // Update every second for smooth countdown
    
    return () => clearInterval(intervalId);
  }, [unlockTime]);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 bg-white">
      <div className="bg-white">
        <Card className={`p-6 shadow-md border-gray-200 bg-white ${HOVER_TRANSITION}`}>
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <Clock className={`h-12 w-12 email-icon ${HOVER_TRANSITION}`} />
            <h2 className="text-xl font-semibold email-text-heading">Message Unlock Delayed</h2>
            <p className="email-text-muted">
              This message has a time-delayed unlock. It will be available in:
            </p>
            
            <div className={cn(
              "text-2xl font-mono font-semibold mt-2",
              progressPercent < 20 ? "text-red-600" :
              progressPercent < 50 ? "email-icon" : "email-icon",
              HOVER_TRANSITION
            )}>
              {remainingTime}
            </div>
            
            {/* Progress bar */}
            <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mt-4">
              <div 
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  progressPercent < 20 ? "bg-red-600" :
                  progressPercent < 50 ? "bg-[var(--email-purple)]" : "bg-[var(--email-purple)]",
                  HOVER_TRANSITION
                )}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            
            <p className="text-sm email-text-muted mt-4">
              Please check back later or keep this page open to access the message when the timer expires.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
