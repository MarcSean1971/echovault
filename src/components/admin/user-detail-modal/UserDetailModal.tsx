
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Mail, Phone, MessageCircle, Calendar, Activity, User } from "lucide-react";
import { UserDetailModalProps } from "./types";
import { useUserDetailData } from "./useUserDetailData";
import { format } from "date-fns";

export function UserDetailModal({ isOpen, onClose, user }: UserDetailModalProps) {
  const { loading, profileData, activityData } = useUserDetailData(isOpen, user);

  if (!user) return null;

  const getUserInitials = () => {
    const firstName = user.first_name || profileData?.first_name || "";
    const lastName = user.last_name || profileData?.last_name || "";
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U";
  };

  const getUserFullName = () => {
    const firstName = user.first_name || profileData?.first_name || "";
    const lastName = user.last_name || profileData?.last_name || "";
    return `${firstName} ${lastName}`.trim() || user.email || "Unknown User";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden p-0 w-[95vw]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-medium">User Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* User Profile Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              {profileData?.avatar_url ? (
                <AvatarImage src={profileData.avatar_url} alt={getUserFullName()} />
              ) : null}
              <AvatarFallback className="text-lg font-medium">{getUserInitials()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">{getUserFullName()}</h3>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <div className="flex gap-2 mt-2 text-xs">
                <span className={`px-2 py-1 rounded ${user.email_confirmed_at ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {user.email_confirmed_at ? 'Email Verified' : 'Email Unverified'}
                </span>
                <span className={`px-2 py-1 rounded ${user.profile_complete ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  {user.profile_complete ? 'Profile Complete' : 'Profile Incomplete'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            {/* Profile Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile Information
              </h4>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-gray-600 font-medium">First Name:</span>
                      <span className="text-red-500 ml-1">*</span>
                    </div>
                    <span className="text-gray-900 font-medium">
                      {profileData?.first_name || user.first_name || "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-gray-600 font-medium">Last Name:</span>
                      <span className="text-red-500 ml-1">*</span>
                    </div>
                    <span className="text-gray-900 font-medium">
                      {profileData?.last_name || user.last_name || "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Primary Email:</span>
                    <span className="text-gray-900 font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-gray-600 font-medium">WhatsApp Number:</span>
                      <span className="text-red-500 ml-1">*</span>
                    </div>
                    <span className="text-gray-900 font-medium">
                      {profileData?.whatsapp_number || "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Backup Email:</span>
                    <span className="text-gray-900 font-medium">
                      {profileData?.backup_email || "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Backup Contact Number:</span>
                    <span className="text-gray-900 font-medium">
                      {profileData?.backup_contact || "Not provided"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Activity</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Messages:</span>
                  <span className="font-medium text-gray-900">
                    {loading ? "..." : activityData?.messagesCount || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Recipients:</span>
                  <span className="font-medium text-gray-900">
                    {loading ? "..." : activityData?.recipientsCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Dates */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Account Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Created:</span>
                  </div>
                  <span className="text-gray-900 font-medium">{format(new Date(user.created_at), 'PPP')}</span>
                </div>
                {user.last_sign_in_at && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Last Sign In:</span>
                    </div>
                    <span className="text-gray-900 font-medium">{format(new Date(user.last_sign_in_at), 'PPp')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
