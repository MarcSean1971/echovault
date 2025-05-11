
import { useState, useEffect } from "react";
import { EnableRecurringToggle } from "./recurring-pattern/EnableRecurringToggle";
import { RecurringPatternContent } from "./recurring-pattern/RecurringPatternContent";
import { RecurringPattern } from "./recurring-pattern/RecurringPatternType";

// Re-export RecurringPattern and RecurringPatternType to maintain compatibility
export { type RecurringPattern } from "./recurring-pattern/RecurringPatternType";
export type { RecurringPatternType } from "./recurring-pattern/RecurringPatternType";

interface RecurringPatternSelectorProps {
  pattern: RecurringPattern | null;
  setPattern: (pattern: RecurringPattern | null) => void;
  forceEnabled?: boolean;
}

export function RecurringPatternSelector({
  pattern,
  setPattern,
  forceEnabled = false
}: RecurringPatternSelectorProps) {
  const [isRecurring, setIsRecurring] = useState(!!pattern || forceEnabled);
  
  // If forceEnabled changes, update isRecurring
  useEffect(() => {
    if (forceEnabled && !isRecurring) {
      setIsRecurring(true);
      if (!pattern) {
        setPattern({ type: 'daily', interval: 1 });
      }
    }
  }, [forceEnabled, isRecurring, pattern, setPattern]);
  
  const handleRecurringChange = (isEnabled: boolean) => {
    if (forceEnabled) return; // Can't disable if forced
    
    setIsRecurring(isEnabled);
    
    if (isEnabled && !pattern) {
      setPattern({ type: 'daily', interval: 1 });
    } else if (!isEnabled) {
      setPattern(null);
    }
  };

  return (
    <div className="space-y-4">
      <EnableRecurringToggle 
        isRecurring={isRecurring}
        onToggle={handleRecurringChange}
        forceEnabled={forceEnabled}
      />
      
      {isRecurring && pattern && (
        <RecurringPatternContent 
          pattern={pattern} 
          setPattern={(newPattern) => setPattern(newPattern)} 
        />
      )}
    </div>
  );
}
