
import { useState, useEffect } from "react";
import { RecurringPattern, RecurringPatternType } from "./RecurringPatternType";
import { TypeSelector } from "./TypeSelector";
import { IntervalSelector } from "./IntervalSelector";
import { DaySelector } from "./DaySelector";
import { MonthSelector } from "./MonthSelector";
import { EarliestDeliverySection } from "./EarliestDeliverySection";
import { format } from "date-fns";

interface RecurringPatternContentProps {
  pattern: RecurringPattern;
  setPattern: (pattern: RecurringPattern) => void;
}

export function RecurringPatternContent({
  pattern,
  setPattern
}: RecurringPatternContentProps) {
  const [startDate, setStartDate] = useState<Date | null>(
    pattern?.startDate ? new Date(pattern.startDate) : null
  );

  const handleTypeChange = (type: RecurringPatternType) => {
    setPattern({ ...pattern, type });
  };
  
  const handleIntervalChange = (interval: number) => {
    setPattern({ ...pattern, interval: Math.max(1, interval) });
  };
  
  const handleDayChange = (day: number) => {
    setPattern({ ...pattern, day });
  };
  
  const handleMonthChange = (month: number) => {
    setPattern({ ...pattern, month });
  };
  
  const handleDateChange = (date: Date | null) => {
    setStartDate(date);
    setPattern({ 
      ...pattern, 
      startDate: date ? format(date, 'yyyy-MM-dd') : undefined 
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <TypeSelector 
        type={pattern.type} 
        onTypeChange={handleTypeChange} 
      />
      
      <IntervalSelector 
        type={pattern.type} 
        interval={pattern.interval} 
        onIntervalChange={handleIntervalChange} 
      />
      
      <DaySelector 
        type={pattern.type} 
        day={pattern.day} 
        onDayChange={handleDayChange} 
      />
      
      {pattern.type === 'yearly' && (
        <MonthSelector 
          month={pattern.month} 
          onMonthChange={handleMonthChange} 
        />
      )}
      
      <EarliestDeliverySection 
        startDate={startDate} 
        onStartDateChange={handleDateChange} 
      />
    </div>
  );
}
