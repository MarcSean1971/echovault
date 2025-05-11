
export type RecurringPatternType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringPattern {
  type: RecurringPatternType;
  interval: number;
  day?: number;
  month?: number;
  startTime?: string;
  startDate?: string;
}
