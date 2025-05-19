
// Re-export from the refactored module
import { useMessageCardActions as useActions } from "./message-actions";

export function useMessageCardActions() {
  return useActions();
}

// Also re-export as default for backward compatibility
export default useMessageCardActions;
