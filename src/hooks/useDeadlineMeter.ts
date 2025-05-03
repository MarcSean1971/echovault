
import { useState, useEffect } from "react";

/**
 * Hook to monitor deadline urgency
 */
export function useDeadlineMeter(nextDeadline: Date | null) {
  const [isUrgent, setIsUrgent] = useState(false);
  const [isVeryUrgent, setIsVeryUrgent] = useState(false);
  
  // Effect to monitor deadline urgency
  useEffect(() => {
    if (!nextDeadline) {
      setIsUrgent(false);
      setIsVeryUrgent(false);
      return;
    }
    
    const checkUrgency = () => {
      const now = new Date();
      const diff = nextDeadline.getTime() - now.getTime();
      const hoursRemaining = Math.max(0, diff / (1000 * 60 * 60));
      
      setIsVeryUrgent(hoursRemaining < 3); 
      setIsUrgent(hoursRemaining < 12 && hoursRemaining >= 3);
    };
    
    checkUrgency();
    const interval = setInterval(checkUrgency, 60000);
    
    return () => clearInterval(interval);
  }, [nextDeadline]);

  return {
    isUrgent,
    isVeryUrgent
  };
}
