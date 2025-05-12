
import { useState, useEffect } from "react";
import { RecurringPatternProps } from "./types";
import { RecurringToggle } from "./RecurringToggle";
import { EarliestDeliveryOption } from "./EarliestDeliveryOption";
import { PatternOptions } from "./PatternOptions";

/**
 * RecurringPatternSelector component refactored into smaller components
 */
export function RecurringPatternSelector({
  pattern,
  setPattern,
  forceEnabled = false
}: RecurringPatternProps) {
  const [isRecurring, setIsRecurring] = useState(!!pattern || forceEnabled);
  const [startDate, setStartDate] = useState<Date | null>(
    pattern?.startDate ? new Date(pattern.startDate) : null
  );
  
  // If forceEnabled changes, update isRecurring
  useEffect(() => {
    if (forceEnabled && !isRecurring) {
      setIsRecurring(true);
      if (!pattern) {
        setPattern({ type: 'daily', interval: 1 });
      }
    }
  }, [forceEnabled, isRecurring, pattern, setPattern]);
  
  const handleRecurringChange = (value: string) => {
    if (forceEnabled) return; // Can't disable if forced
    
    const isEnabled = value === "yes";
    setIsRecurring(isEnabled);
    
    if (isEnabled && !pattern) {
      setPattern({ type: 'daily', interval: 1 });
    } else if (!isEnabled) {
      setPattern(null);
    }
  };
  
  return (
    <div className="space-y-4">
      {!forceEnabled && (
        <RecurringToggle 
          isRecurring={isRecurring}
          onRecurringChange={handleRecurringChange}
        />
      )}
      
      {isRecurring && (
        <div className="space-y-4 pt-2">
          <EarliestDeliveryOption 
            startDate={startDate}
            setStartDate={setStartDate}
            pattern={pattern}
            setPattern={setPattern}
          />
          
          <PatternOptions pattern={pattern} setPattern={setPattern} />
        </div>
      )}
    </div>
  );
}

// Re-export for backward compatibility
export * from "./types";
