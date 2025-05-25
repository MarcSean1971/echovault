
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            User Profile Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mx-6 mt-4 bg-muted/50">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="auth" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Auth</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
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
