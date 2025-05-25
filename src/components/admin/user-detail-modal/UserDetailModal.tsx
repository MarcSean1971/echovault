
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Activity, FileText } from "lucide-react";
import { UserDetailModalProps } from "./types";
import { useUserDetailData } from "./useUserDetailData";
import { OverviewTab } from "./tabs/OverviewTab";
import { ProfileTab } from "./tabs/ProfileTab";
import { AuthTab } from "./tabs/AuthTab";
import { ActivityTab } from "./tabs/ActivityTab";

export function UserDetailModal({ isOpen, onClose, user }: UserDetailModalProps) {
  const { loading, profileData, activityData } = useUserDetailData(isOpen, user);

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden p-0 w-[95vw]">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="truncate">User Profile Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mx-4 sm:mx-6 mt-4 bg-muted/50">
              <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="auth" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Auth</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Activity</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
              <TabsContent value="overview" className="mt-4 space-y-0">
                <OverviewTab 
                  user={user} 
                  profileData={profileData} 
                  activityData={activityData}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="profile" className="mt-4 space-y-0">
                <ProfileTab user={user} profileData={profileData} />
              </TabsContent>

              <TabsContent value="auth" className="mt-4 space-y-0">
                <AuthTab user={user} profileData={profileData} />
              </TabsContent>

              <TabsContent value="activity" className="mt-4 space-y-0">
                <ActivityTab 
                  user={user} 
                  activityData={activityData} 
                  loading={loading} 
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
