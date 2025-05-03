
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
      interval = window.setInterval(() => {
        setIsVisible(prev => !prev);
      }, 800);
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
    <div className="w-4 h-4 rounded-full border border-red-500 flex items-center justify-center">
      <div 
        className={`w-3 h-3 rounded-full bg-red-500 ${HOVER_TRANSITION}
          ${isPaused 
            ? 'opacity-50' 
            : isVisible 
              ? 'opacity-100' 
              : 'opacity-40'
          }
        `} 
      />
    </div>
  );
}
