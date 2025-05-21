
import { useState, useRef } from "react";
import { MessageDetailState } from "./types";

/**
 * Hook to manage the state of the message detail
 * Separates state concerns from data fetching
 */
export function useMessageDetailState(): MessageDetailState & {
  setMessage: (message: any) => void;
  setIsArmed: (isArmed: boolean) => void;
  setDeadline: (deadline: Date | null) => void;
  setConditionId: (conditionId: string | null) => void;
  setCondition: (condition: any | null) => void;
  setRecipients: (recipients: any[]) => void;
  setLastCheckIn: (lastCheckIn: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setRefreshCount: (cb: (prev: number) => number) => void;
  setHasAttemptedFetch: (hasAttemptedFetch: boolean) => void;
  hasAttemptedFetch: boolean;
  lastRefreshTimeRef: React.MutableRefObject<number>;
  refreshTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
} {
  const [message, setMessage] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArmed, setIsArmed] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [conditionId, setConditionId] = useState<string | null>(null);
  const [condition, setCondition] = useState<any | null>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Add a ref to track the last refresh time to prevent duplicate refreshes
  const lastRefreshTimeRef = useRef<number>(0);
  // Add a timeout ref to implement debouncing
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  return {
    message,
    isLoading,
    isArmed,
    deadline,
    conditionId,
    condition,
    recipients,
    lastCheckIn,
    refreshCount,
    setMessage,
    setIsLoading,
    setIsArmed,
    setDeadline,
    setConditionId,
    setCondition,
    setRecipients,
    setLastCheckIn,
    setRefreshCount,
    setHasAttemptedFetch,
    hasAttemptedFetch,
    lastRefreshTimeRef,
    refreshTimeoutRef
  };
}
