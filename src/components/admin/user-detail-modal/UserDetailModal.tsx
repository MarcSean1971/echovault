
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { UserDetailModalProps } from "./types";
import { useUserDetailData } from "./useUserDetailData";
import { UserProfileSection } from "./UserProfileSection";
import { ProfileCompletionAlert } from "./ProfileCompletionAlert";
import { AuthDetailsSection } from "./AuthDetailsSection";
import { AccountTimelineSection } from "./AccountTimelineSection";
import { ProfileInfoSection } from "./ProfileInfoSection";
import { ActivitySection } from "./ActivitySection";

export function UserDetailModal({ isOpen, onClose, user }: UserDetailModalProps) {
  const { loading, profileData, activityData } = useUserDetailData(isOpen, user);

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <UserProfileSection user={user} profileData={profileData} />
          
          <ProfileCompletionAlert user={user} profileData={profileData} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AuthDetailsSection user={user} />
            <AccountTimelineSection user={user} profileData={profileData} />
          </div>

          <ProfileInfoSection user={user} profileData={profileData} />

          <ActivitySection loading={loading} activityData={activityData} />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
