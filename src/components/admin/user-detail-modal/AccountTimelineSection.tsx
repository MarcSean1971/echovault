
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { AuthUser, UserProfile } from "./types";

interface AccountTimelineSectionProps {
  user: AuthUser;
  profileData: UserProfile | null;
}

export function AccountTimelineSection({ user, profileData }: AccountTimelineSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Account Timeline
      </h4>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Account Created:</span>{' '}
          {format(new Date(user.created_at), 'PPpp')}
        </div>
        <div>
          <span className="font-medium">Last Updated:</span>{' '}
          {format(new Date(user.updated_at), 'PPpp')}
        </div>
        {profileData && (
          <div>
            <span className="font-medium">Profile Created:</span>{' '}
            {format(new Date(profileData.created_at), 'PPpp')}
          </div>
        )}
      </div>
    </div>
  );
}
