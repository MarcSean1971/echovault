
import { MessageCondition } from "@/types/message";

export interface ConditionState {
  isArmed: boolean;
  deadline: Date | null;
  condition: MessageCondition | null;
  isPanicTrigger: boolean;
  transcription: string | null;
  refreshCounter: number;
  isLoading: boolean;
}

export interface ConditionFetchResult {
  condition: MessageCondition | null;
  isArmed: boolean;
  isPanicTrigger: boolean;
}
