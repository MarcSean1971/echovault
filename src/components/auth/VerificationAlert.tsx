
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface VerificationAlertProps {
  isDevelopment: boolean;
}

export function VerificationAlert({ isDevelopment }: VerificationAlertProps) {
  if (!isDevelopment) return null;
  
  return (
    <div className="px-6">
      <Alert className="mb-4">
        <AlertTitle>Development Mode</AlertTitle>
        <AlertDescription>
          In development mode, verification emails are not actually sent to your inbox. 
          Instead, you can view them in your <a 
            href="https://dashboard.clerk.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            Clerk dashboard
          </a> under Users &rarr; select your user &rarr; Emails tab.
        </AlertDescription>
      </Alert>
    </div>
  );
}
