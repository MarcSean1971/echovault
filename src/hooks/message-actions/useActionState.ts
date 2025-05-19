
import { useState } from "react";

/**
 * Simple hook to manage loading state for message actions
 */
export function useActionState() {
  const [isLoading, setIsLoading] = useState(false);
  
  return {
    isLoading,
    setIsLoading
  };
}
