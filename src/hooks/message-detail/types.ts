
import { Message, MessageCondition } from "@/types/message";

export interface MessageDetailState {
  message: Message | null;
  isLoading: boolean;
  isArmed: boolean;
  deadline: Date | null;
  conditionId: string | null;
  condition: MessageCondition | null;
  recipients: any[];
  lastCheckIn: string | null;
  refreshCount: number;
}

export interface UseMessageDetailOptions {
  messageId: string | undefined;
  onError: () => void;
}

export interface MessageDetailActions {
  setIsArmed: (isArmed: boolean) => void;
}
