
import { AlertTriangle } from "lucide-react";
import { AuthUser, UserProfile } from "./types";
import { getMissingFields } from "./utils";

interface ProfileCompletionAlertProps {
  user: AuthUser;
  profileData: UserProfile | null;
}

export function ProfileCompletionAlert({ user, profileData }: ProfileCompletionAlertProps) {
  if (user.profile_complete) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
        <div>
          <h4 className="font-medium text-orange-800">Profile Incomplete</h4>
          <p className="text-sm text-orange-700 mt-1">
            Missing: {getMissingFields(user, profileData).join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
}
