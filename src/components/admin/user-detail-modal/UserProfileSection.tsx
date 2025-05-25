
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { AuthUser, UserProfile } from "./types";
import { getUserInitials, getUserFullName } from "./utils";

interface UserProfileSectionProps {
  user: AuthUser;
  profileData: UserProfile | null;
}

export function UserProfileSection({ user, profileData }: UserProfileSectionProps) {
  const getProfileStatusBadge = () => {
    if (!user?.has_profile) {
      return <Badge variant="secondary">Profile Not Started</Badge>;
    } else if (user.profile_complete) {
      return <Badge variant="default">Profile Complete</Badge>;
    } else {
      return <Badge variant="destructive">Profile Incomplete</Badge>;
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Avatar className="h-16 w-16">
        {profileData?.avatar_url ? (
          <AvatarImage src={profileData.avatar_url} alt={getUserFullName(user)} />
        ) : null}
        <AvatarFallback className="text-lg">{getUserInitials(user)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <h3 className="text-lg font-medium">{getUserFullName(user)}</h3>
        <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
        <div className="flex gap-2 mt-2">
          <Badge variant={user.email_confirmed_at ? "default" : "destructive"}>
            {user.email_confirmed_at ? (
              <><CheckCircle className="h-3 w-3 mr-1" />Email Verified</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" />Email Unverified</>
            )}
          </Badge>
          {getProfileStatusBadge()}
        </div>
      </div>
    </div>
  );
}
