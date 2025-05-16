
// Re-export toast hooks with optimizations
import { useToast as useOriginalToast, toast as originalToast } from "@/hooks/use-toast";

// Add debounced toast to prevent too many toasts
const pendingToasts = new Map();

// Optimized toast function with debouncing for better performance
export const toast = (props: Parameters<typeof originalToast>[0]) => {
  const key = props.title + (props.description || '');
  
  // If this exact toast is already pending, clear the timeout
  if (pendingToasts.has(key)) {
    clearTimeout(pendingToasts.get(key));
  }
  
  // Set a short timeout to debounce rapid toast calls
  const timeoutId = setTimeout(() => {
    originalToast(props);
    pendingToasts.delete(key);
  }, 100);
  
  pendingToasts.set(key, timeoutId);
};

// Export the original hook
export const useToast = useOriginalToast;
