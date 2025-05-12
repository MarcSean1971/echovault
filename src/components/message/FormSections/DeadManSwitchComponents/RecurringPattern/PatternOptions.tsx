
import { PatternOptionProps } from "./types";
import { FrequencySelector } from "./FrequencySelector";
import { IntervalSelector } from "./IntervalSelector";
import { WeeklySelector } from "./WeeklySelector";
import { MonthlySelector } from "./MonthlySelector";
import { YearlySelector } from "./YearlySelector";

export function PatternOptions({ pattern, setPattern }: PatternOptionProps) {
  if (!pattern) return null;
  
  return (
    <>
      <FrequencySelector pattern={pattern} setPattern={setPattern} />
      <IntervalSelector pattern={pattern} setPattern={setPattern} />
      
      {pattern.type === 'weekly' && (
        <WeeklySelector pattern={pattern} setPattern={setPattern} />
      )}
      
      {pattern.type === 'monthly' && (
        <MonthlySelector pattern={pattern} setPattern={setPattern} />
      )}
      
      {pattern.type === 'yearly' && (
        <YearlySelector pattern={pattern} setPattern={setPattern} />
      )}
    </>
  );
}
