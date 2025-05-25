
import { format } from "date-fns";
import { Mail } from "lucide-react";
import { AuthUser } from "./types";

interface AuthDetailsSectionProps {
  user: AuthUser;
}

export function AuthDetailsSection({ user }: AuthDetailsSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Mail className="h-4 w-4" />
        Authentication Details
      </h4>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Email:</span> {user.email}
        </div>
        <div>
          <span className="font-medium">Email Confirmed:</span>{' '}
          {user.email_confirmed_at ? (
            <span className="text-green-600">
              {format(new Date(user.email_confirmed_at), 'PPpp')}
            </span>
          ) : (
            <span className="text-red-600">Not confirmed</span>
          )}
        </div>
        <div>
          <span className="font-medium">Last Sign In:</span>{' '}
          {user.last_sign_in_at ? (
            format(new Date(user.last_sign_in_at), 'PPpp')
          ) : (
            <span className="text-muted-foreground">Never</span>
          )}
        </div>
      </div>
    </div>
  );
}
