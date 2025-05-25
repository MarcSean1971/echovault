
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MessageCircle, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { AuthUser, UserProfile } from "../types";
import { getMissingFields, getProfileCompletionPercentage } from "../utils";

interface ProfileTabProps {
  user: AuthUser;
  profileData: UserProfile | null;
}

export function ProfileTab({ user, profileData }: ProfileTabProps) {
  const missingFields = getMissingFields(user, profileData);
  const completionPercentage = getProfileCompletionPercentage(user, profileData);

  if (!user.has_profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Profile Created</h3>
        <p className="text-gray-600 max-w-md">
          This user hasn't set up their profile yet. No additional information is available.
        </p>
      </div>
    );
  }

  const profileFields = [
    {
      label: "First Name",
      value: user.first_name || profileData?.first_name,
      icon: User,
      required: true
    },
    {
      label: "Last Name", 
      value: user.last_name || profileData?.last_name,
      icon: User,
      required: true
    },
    {
      label: "Email",
      value: profileData?.email,
      icon: Mail,
      required: true
    },
    {
      label: "Backup Email",
      value: profileData?.backup_email,
      icon: Mail,
      required: true
    },
    {
      label: "Backup Contact",
      value: profileData?.backup_contact,
      icon: Phone,
      required: true
    },
    {
      label: "WhatsApp Number",
      value: profileData?.whatsapp_number,
      icon: MessageCircle,
      required: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Completion Alert */}
      {!user.profile_complete && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-amber-800">Profile Incomplete ({completionPercentage}%)</h4>
              <p className="text-sm text-amber-700 mt-1">
                Missing: {missingFields.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profileFields.map((field) => (
              <div key={field.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <field.icon className="h-4 w-4" />
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </div>
                <div className="flex items-center gap-2">
                  {field.value ? (
                    <>
                      <span className="text-sm text-gray-900 max-w-[200px] truncate">{field.value}</span>
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-red-600 italic">Missing</span>
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Avatar Information */}
      {profileData?.avatar_url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img 
                src={profileData.avatar_url} 
                alt="Profile Avatar" 
                className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Avatar uploaded</p>
                <p className="text-xs text-gray-500 truncate">{profileData.avatar_url}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
