
import React, { useState, useEffect } from "react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface RecordingIndicatorProps {
  isPaused: boolean;
}

export function RecordingIndicator({ isPaused }: RecordingIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  // Add a blinking effect when recording is active
  useEffect(() => {
    let interval: number | null = null;
    
    if (!isPaused) {
      // Faster blink rate for better visibility
      interval = window.setInterval(() => {
        setIsVisible(prev => !prev);
      }, 500);
    } else {
      setIsVisible(true);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPaused]);
  
  return (
    <div className="w-5 h-5 rounded-full border border-red-500 flex items-center justify-center bg-black/30 p-0.5">
      <div 
        className={`w-full h-full rounded-full bg-red-600 ${HOVER_TRANSITION}
          ${isPaused 
            ? 'opacity-50' 
            : isVisible 
              ? 'opacity-100 animate-pulse' 
              : 'opacity-20'
          }
        `} 
      />
    </div>
  );
}
