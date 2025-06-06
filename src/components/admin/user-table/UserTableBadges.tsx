
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { AuthUser } from "./types";

interface UserTableBadgesProps {
  user: AuthUser;
}

export function EmailVerificationBadge({ user }: UserTableBadgesProps) {
  return null;
}

export function ProfileCompletionBadge({ user }: UserTableBadgesProps) {
  if (!user.has_profile) {
    return (
      <Badge variant="secondary">
        <User className="h-3 w-3 mr-1" />Not Started
      </Badge>
    );
  } else if (user.profile_complete) {
    return (
      <Badge variant="default">
        <User className="h-3 w-3 mr-1" />Complete
      </Badge>
    );
  } else {
    return (
      <Badge variant="destructive">
        <User className="h-3 w-3 mr-1" />Incomplete
      </Badge>
    );
  }
}

export function UserTableBadges({ user }: UserTableBadgesProps) {
  return (
    <div className="flex gap-1">
      <ProfileCompletionBadge user={user} />
      <EmailVerificationBadge user={user} />
    </div>
  );
}
