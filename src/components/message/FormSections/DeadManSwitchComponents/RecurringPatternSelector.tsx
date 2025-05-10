
import { useState, useEffect } from "react";
import { RecurringPattern, RecurringPatternType } from "@/types/message";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export interface RecurringPatternSelectorProps {
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  forceEnabled?: boolean; // Make forceEnabled optional with a default value
}

export function RecurringPatternSelector({ 
  recurringPattern, 
  setRecurringPattern,
  forceEnabled = false // Default to false if not provided
}: RecurringPatternSelectorProps) {
  const [isEnabled, setIsEnabled] = useState(!!recurringPattern || forceEnabled);
  const [patternType, setPatternType] = useState<RecurringPatternType>(
    recurringPattern?.type || 'daily'
  );
  const [interval, setInterval] = useState<number>(recurringPattern?.interval || 1);
  
  // When forceEnabled changes or recurringPattern is initially set, update isEnabled
  useEffect(() => {
    if (forceEnabled) {
      setIsEnabled(true);
    } else if (recurringPattern) {
      setIsEnabled(true);
    }
  }, [forceEnabled, recurringPattern]);

  // When enabled state changes, update the recurringPattern
  useEffect(() => {
    if (isEnabled) {
      setRecurringPattern({
        type: patternType,
        interval: interval
      });
    } else if (!forceEnabled) {
      setRecurringPattern(null);
    }
  }, [isEnabled, patternType, interval, setRecurringPattern, forceEnabled]);

  // Handle interval change
  const handleIntervalChange = (value: string) => {
    const intervalValue = parseInt(value, 10);
    setInterval(isNaN(intervalValue) || intervalValue < 1 ? 1 : intervalValue);
  };

  // Handle pattern type change
  const handlePatternTypeChange = (value: string) => {
    setPatternType(value as RecurringPatternType);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="recurring-enabled">Recurring Schedule</Label>
          <p className="text-xs text-muted-foreground">Send message on a repeating schedule</p>
        </div>
        {!forceEnabled && (
          <Switch
            id="recurring-enabled"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        )}
      </div>
      
      {(isEnabled || forceEnabled) && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="interval">Repeat every</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  id="interval"
                  type="number"
                  min={1}
                  value={interval}
                  onChange={(e) => handleIntervalChange(e.target.value)}
                  className={`w-20 ${HOVER_TRANSITION}`}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="pattern-type">Time unit</Label>
              <Select value={patternType} onValueChange={handlePatternTypeChange}>
                <SelectTrigger id="pattern-type" className={HOVER_TRANSITION}>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Day(s)</SelectItem>
                  <SelectItem value="weekly">Week(s)</SelectItem>
                  <SelectItem value="monthly">Month(s)</SelectItem>
                  <SelectItem value="yearly">Year(s)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
