import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { RecurringPattern, RecurringPatternType } from "@/types/message";

interface RecurringPatternSelectorProps {
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
}

export function RecurringPatternSelector({
  recurringPattern,
  setRecurringPattern
}: RecurringPatternSelectorProps) {
  const [patternType, setPatternType] = useState<RecurringPatternType>('daily');
  const [interval, setInterval] = useState(1);
  const [day, setDay] = useState<number | undefined>(undefined);
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);

  // Initialize form with existing pattern if available
  useEffect(() => {
    if (recurringPattern) {
      if (typeof recurringPattern !== 'string') {
        setPatternType(recurringPattern.type);
        setInterval(recurringPattern.interval);
        setDay(recurringPattern.day);
        setMonth(recurringPattern.month);
        setStartDate(recurringPattern.startDate ? new Date(recurringPattern.startDate) : undefined);
      }
    }
  }, [recurringPattern]);

  // Update the recurring pattern when form fields change
  useEffect(() => {
    const newPattern: RecurringPattern = {
      type: patternType,
      interval: interval,
      ...(day !== undefined && { day }),
      ...(month !== undefined && { month }),
      ...(startDate !== undefined && { startDate: startDate.toISOString() })
    };
    
    setRecurringPattern(newPattern);
  }, [patternType, interval, day, month, startDate, setRecurringPattern]);

  // Handle pattern type change
  const handlePatternTypeChange = (value: string) => {
    setPatternType(value as RecurringPatternType);
    
    // Reset fields that don't apply to the new pattern type
    switch (value) {
      case 'daily':
        setDay(undefined);
        setMonth(undefined);
        break;
      case 'weekly':
        setMonth(undefined);
        break;
      case 'monthly':
        // Keep day
        setMonth(undefined);
        break;
      case 'yearly':
        // Keep day and month
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patternType">Repeat</Label>
          <Select
            value={patternType}
            onValueChange={handlePatternTypeChange}
          >
            <SelectTrigger id="patternType">
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
          <Label htmlFor="interval">Every</Label>
          <div className="flex items-center space-x-2">
            <Input 
              id="interval"
              type="number"
              min="1"
              max="365"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <span>
              {patternType === 'daily' && 'day(s)'}
              {patternType === 'weekly' && 'week(s)'}
              {patternType === 'monthly' && 'month(s)'}
              {patternType === 'yearly' && 'year(s)'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Day of month/week selector for monthly/yearly */}
      {(patternType === 'monthly' || patternType === 'yearly') && (
        <div className="space-y-2">
          <Label htmlFor="day">Day of {patternType === 'yearly' ? 'month' : 'month'}</Label>
          <Input 
            id="day"
            type="number"
            min="1"
            max="31"
            value={day || ''}
            onChange={(e) => setDay(parseInt(e.target.value) || undefined)}
            placeholder="e.g., 15"
          />
        </div>
      )}
      
      {/* Month selector for yearly */}
      {patternType === 'yearly' && (
        <div className="space-y-2">
          <Label htmlFor="month">Month</Label>
          <Select
            value={month?.toString() || ''}
            onValueChange={(value) => setMonth(parseInt(value) || undefined)}
          >
            <SelectTrigger id="month">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">January</SelectItem>
              <SelectItem value="2">February</SelectItem>
              <SelectItem value="3">March</SelectItem>
              <SelectItem value="4">April</SelectItem>
              <SelectItem value="5">May</SelectItem>
              <SelectItem value="6">June</SelectItem>
              <SelectItem value="7">July</SelectItem>
              <SelectItem value="8">August</SelectItem>
              <SelectItem value="9">September</SelectItem>
              <SelectItem value="10">October</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">December</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
