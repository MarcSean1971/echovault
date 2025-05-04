
import { useEffect } from "react";

export function useErrorHandler() {
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Global error caught:", error);
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);
}
