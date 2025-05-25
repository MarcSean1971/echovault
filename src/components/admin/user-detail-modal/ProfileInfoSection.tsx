
import { User } from "lucide-react";
import { AuthUser, UserProfile } from "./types";

interface ProfileInfoSectionProps {
  user: AuthUser;
  profileData: UserProfile | null;
}

export function ProfileInfoSection({ user, profileData }: ProfileInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <User className="h-4 w-4" />
        Profile Information
      </h4>
      {user.has_profile && profileData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            {profileData.backup_email && (
              <div>
                <span className="font-medium">Backup Email:</span> {profileData.backup_email}
              </div>
            )}
            {profileData.backup_contact && (
              <div>
                <span className="font-medium">Backup Contact:</span> {profileData.backup_contact}
              </div>
            )}
            {profileData.whatsapp_number && (
              <div>
                <span className="font-medium">WhatsApp:</span> {profileData.whatsapp_number}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 p-4 rounded-md">
          <p className="text-sm text-muted-foreground">
            This user has not completed their profile setup yet.
          </p>
        </div>
      )}
      {user.has_profile && profileData && !profileData.backup_email && !profileData.backup_contact && !profileData.whatsapp_number && (
        <p className="text-sm text-muted-foreground">No additional contact information available</p>
      )}
    </div>
  );
}
