
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function PanicTrigger() {
  return (
    <Alert variant="warning" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
      <AlertTriangle className="h-4 w-4 text-yellow-800 dark:text-yellow-200" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200 font-medium">
        Manual Panic Trigger
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
        This will create a message that you can manually trigger in an emergency situation.
        A panic button will be available for you to send this message instantly when needed.
      </AlertDescription>
    </Alert>
  );
}
