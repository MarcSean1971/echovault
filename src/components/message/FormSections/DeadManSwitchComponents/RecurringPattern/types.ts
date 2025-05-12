
import type { RecurringPattern, RecurringPatternType } from "@/types/message";

export type { RecurringPattern, RecurringPatternType };

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
