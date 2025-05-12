
import type { RecurringPattern } from "@/types/message";

// Define RecurringPatternType since it's not exported from @/types/message
export type RecurringPatternType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringPatternProps {
  pattern: RecurringPattern | null;
  setPattern: (pattern: RecurringPattern | null) => void;
  forceEnabled?: boolean;
}

export interface PatternOptionProps {
  pattern: RecurringPattern | null;
  setPattern: (pattern: RecurringPattern | null) => void;
}

export interface DatePickerOptionProps extends PatternOptionProps {
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
}
