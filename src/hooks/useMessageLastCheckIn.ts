
import { useState, useEffect } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { MessageCondition } from "@/types/message";

export function useMessageLastCheckIn(condition: MessageCondition | null) {
  const [formattedCheckIn, setFormattedCheckIn] = useState<string | null>(null);
  const [rawCheckInTime, setRawCheckInTime] = useState<string | null>(null);
  const [isDeadmansSwitch, setIsDeadmansSwitch] = useState(false);
  
  useEffect(() => {
    if (!condition) return;
    
    // Check if this is a deadman's switch message
    const isDMS = condition.condition_type === 'no_check_in' || 
                 condition.condition_type === 'regular_check_in';
    setIsDeadmansSwitch(isDMS);
    
    // If condition has a last_checked timestamp, use it regardless of condition type
    if (condition.last_checked) {
      setRawCheckInTime(condition.last_checked);
      
      try {
        const checkInDate = parseISO(condition.last_checked);
        const formatted = formatDistanceToNow(checkInDate, { addSuffix: true });
        setFormattedCheckIn(formatted);
      } catch (error) {
        console.error("Error formatting check-in time:", error);
        setFormattedCheckIn(null);
      }
    } else {
      setFormattedCheckIn(null);
      setRawCheckInTime(null);
    }
  }, [condition]);
  
  return {
    formattedCheckIn,
    rawCheckInTime,
    isDeadmansSwitch
  };
}
