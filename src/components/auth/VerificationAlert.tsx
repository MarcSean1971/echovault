
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
            href="https://supabase.com/dashboard/project/onwthrpgcnfydxzzmyot/auth/users" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            Supabase dashboard
          </a> under Authentication &rarr; Users &rarr; select your user.
        </AlertDescription>
      </Alert>
    </div>
  );
}
