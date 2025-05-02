
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

interface SendingProgressProps {
  hasSendingStarted: boolean;
  isSending: boolean;
  sentCount: number;
  totalCount: number;
  error: string | null;
}

export function SendingProgress({ 
  hasSendingStarted, 
  isSending, 
  sentCount, 
  totalCount, 
  error 
}: SendingProgressProps) {
  if (!hasSendingStarted && !error) return null;

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>
            {error}
            {error.includes("domain verification") && (
              <p className="mt-1">
                During testing, you can only send to your own verified email address. 
                To send to other addresses, verify your domain in Resend.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {hasSendingStarted && (
        <div className="rounded-md bg-muted p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Progress: {sentCount} of {totalCount}
            </span>
            {isSending && <Spinner size="sm" />}
          </div>
        </div>
      )}
    </div>
  );
}
