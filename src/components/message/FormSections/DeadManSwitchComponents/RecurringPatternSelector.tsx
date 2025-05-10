
import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RecurringPatternType, RecurringPattern } from "@/types/message";

interface RecurringPatternSelectorProps {
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  forceEnabled?: boolean;
}

export function RecurringPatternSelector({
  recurringPattern,
  setRecurringPattern,
  forceEnabled = false
}: RecurringPatternSelectorProps) {
  const isEnabled = forceEnabled || !!recurringPattern;

  // Handle initial state
  useEffect(() => {
    if (forceEnabled && !recurringPattern) {
      // If it needs to be enabled but no pattern exists, create a default one
      setRecurringPattern({
        type: 'daily',
        interval: 1
      });
    }
  }, [forceEnabled, recurringPattern, setRecurringPattern]);

  // Toggle the recurring pattern on/off
  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      setRecurringPattern({
        type: 'daily',
        interval: 1
      });
    } else {
      setRecurringPattern(null);
    }
  };

  // Update recurring pattern type
  const handleTypeChange = (type: string) => {
    setRecurringPattern({
      type: type as RecurringPatternType,
      interval: recurringPattern?.interval || 1
    });
  };

  // Update recurring pattern interval
  const handleIntervalChange = (interval: number) => {
    if (recurringPattern) {
      setRecurringPattern({
        ...recurringPattern,
        type: recurringPattern.type,
        interval: interval
      });
    }
  };

  // Update day of week/month
  const handleDayChange = (day: number) => {
    if (recurringPattern) {
      setRecurringPattern({
        ...recurringPattern,
        day
      });
    }
  };

  // Update month
  const handleMonthChange = (month: number) => {
    if (recurringPattern) {
      setRecurringPattern({
        ...recurringPattern,
        month
      });
    }
  };

  return (
    <div className="space-y-4">
      {!forceEnabled && (
        <div className="flex items-center space-x-2">
          <Switch
            id="recurring"
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
          <Label htmlFor="recurring">Recurring delivery</Label>
        </div>
      )}

      {isEnabled && recurringPattern && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pattern-type">Repeat</Label>
              <Select
                value={recurringPattern.type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger id="pattern-type">
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

            <div className="space-y-2">
              <Label htmlFor="pattern-interval">Every</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="pattern-interval"
                  type="number"
                  min={1}
                  max={99}
                  value={recurringPattern.interval}
                  onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <span>
                  {recurringPattern.type === "daily" && "days"}
                  {recurringPattern.type === "weekly" && "weeks"}
                  {recurringPattern.type === "monthly" && "months"}
                  {recurringPattern.type === "yearly" && "years"}
                </span>
              </div>
            </div>
          </div>

          {recurringPattern.type === "weekly" && (
            <div className="space-y-2">
              <Label htmlFor="day-of-week">Day of week</Label>
              <Select
                value={String(recurringPattern.day || 0)}
                onValueChange={(value) => handleDayChange(parseInt(value))}
              >
                <SelectTrigger id="day-of-week">
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
        </div>
      )}
    </div>
  );
}
