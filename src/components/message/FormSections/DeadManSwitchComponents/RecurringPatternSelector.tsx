import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { RecurringPattern } from "@/types/message";

// Export this for backward compatibility
export type RecurringPatternType = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Re-export RecurringPattern to maintain compatibility
export type { RecurringPattern };

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
  
  const handleTypeChange = (type: RecurringPatternType) => {
    if (pattern) {
      setPattern({ ...pattern, type });
    } else {
      setPattern({ type, interval: 1 });
    }
  };
  
  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interval = parseInt(e.target.value) || 1;
    if (pattern) {
      setPattern({ ...pattern, interval: Math.max(1, interval) });
    }
  };
  
  const handleDayChange = (day: number) => {
    if (pattern) {
      setPattern({ ...pattern, day });
    }
  };
  
  const handleMonthChange = (month: number) => {
    if (pattern) {
      setPattern({ ...pattern, month });
    }
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (pattern) {
      setPattern({ ...pattern, startTime: e.target.value });
    }
  };
  
  return (
    <div className="space-y-4">
      {!forceEnabled && (
        <div>
          <Label className="mb-2 block">Make this recurring?</Label>
          <RadioGroup 
            value={isRecurring ? "yes" : "no"} 
            onValueChange={handleRecurringChange}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="recurring-yes" />
              <Label htmlFor="recurring-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="recurring-no" />
              <Label htmlFor="recurring-no">No</Label>
            </div>
          </RadioGroup>
        </div>
      )}
      
      {isRecurring && (
        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="recurring-type" className="mb-2 block">Repeat</Label>
            <Select 
              value={pattern?.type || 'daily'}
              onValueChange={(value) => handleTypeChange(value as RecurringPatternType)}
            >
              <SelectTrigger id="recurring-type">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="recurring-interval" className="mb-2 block">
              Every
              {pattern?.type === 'daily' ? ' X days' : ''}
              {pattern?.type === 'weekly' ? ' X weeks' : ''}
              {pattern?.type === 'monthly' ? ' X months' : ''}
              {pattern?.type === 'yearly' ? ' X years' : ''}
            </Label>
            <Input
              id="recurring-interval"
              type="number"
              min={1}
              value={pattern?.interval || 1}
              onChange={handleIntervalChange}
            />
          </div>
          
          {pattern?.type === 'weekly' && (
            <div>
              <Label className="mb-2 block">On day</Label>
              <Select 
                value={pattern.day?.toString() || "0"}
                onValueChange={(value) => handleDayChange(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {pattern?.type === 'monthly' && (
            <div>
              <Label className="mb-2 block">On day of month</Label>
              <Select
                value={pattern.day?.toString() || "1"}
                onValueChange={(value) => handleDayChange(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 31}, (_, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {pattern?.type === 'yearly' && (
            <>
              <div>
                <Label className="mb-2 block">Month</Label>
                <Select
                  value={pattern.month?.toString() || "0"}
                  onValueChange={(value) => handleMonthChange(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">January</SelectItem>
                    <SelectItem value="1">February</SelectItem>
                    <SelectItem value="2">March</SelectItem>
                    <SelectItem value="3">April</SelectItem>
                    <SelectItem value="4">May</SelectItem>
                    <SelectItem value="5">June</SelectItem>
                    <SelectItem value="6">July</SelectItem>
                    <SelectItem value="7">August</SelectItem>
                    <SelectItem value="8">September</SelectItem>
                    <SelectItem value="9">October</SelectItem>
                    <SelectItem value="10">November</SelectItem>
                    <SelectItem value="11">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-2 block">Day</Label>
                <Select
                  value={pattern.day?.toString() || "1"}
                  onValueChange={(value) => handleDayChange(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 31}, (_, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          <div>
            <Label htmlFor="start-time" className="mb-2 block">Start time (optional)</Label>
            <Input
              id="start-time"
              type="time"
              value={pattern?.startTime || ""}
              onChange={handleTimeChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
