
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MessageCircle, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { AuthUser, UserProfile } from "../types";

interface ProfileTabProps {
  user: AuthUser;
  profileData: UserProfile | null;
}

export function ProfileTab({ user, profileData }: ProfileTabProps) {
  const profileFields = [
    {
      label: "First Name",
      value: user.first_name || profileData?.first_name,
      icon: User,
      color: "text-blue-500"
    },
    {
      label: "Last Name", 
      value: user.last_name || profileData?.last_name,
      icon: User,
      color: "text-blue-500"
    },
    {
      label: "Profile Email",
      value: profileData?.email,
      icon: Mail,
      color: "text-green-500"
    },
    {
      label: "Backup Email",
      value: profileData?.backup_email,
      icon: Mail,
      color: "text-amber-500"
    },
    {
      label: "Backup Contact",
      value: profileData?.backup_contact,
      icon: Phone,
      color: "text-purple-500"
    },
    {
      label: "WhatsApp Number",
      value: profileData?.whatsapp_number,
      icon: MessageCircle,
      color: "text-emerald-500"
    }
  ];

  if (!user.has_profile) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">No Profile Data</h3>
          <p className="text-amber-700">
            This user has not completed their profile setup yet. No additional profile information is available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Profile Exists:</span>
            <Badge variant={user.has_profile ? "default" : "secondary"}>
              {user.has_profile ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Profile Complete:</span>
            <Badge variant={user.profile_complete ? "default" : "destructive"}>
              {user.profile_complete ? "Complete" : "Incomplete"}
            </Badge>
          </div>
          {profileData && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profile Created:</span>
              <span className="text-sm text-gray-600">
                {format(new Date(profileData.created_at), 'PPpp')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileFields.slice(0, 2).map((field) => (
              <div key={field.label} className="space-y-2">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <field.icon className={`h-4 w-4 ${field.color}`} />
                  {field.label}
                </label>
                <div className="p-3 bg-gray-50 rounded-md min-h-[44px] flex items-center">
                  {field.value ? (
                    <span className="text-sm">{field.value}</span>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Not provided</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profileFields.slice(2).map((field) => (
              <div key={field.label} className="space-y-2">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <field.icon className={`h-4 w-4 ${field.color}`} />
                  {field.label}
                </label>
                <div className="p-3 bg-gray-50 rounded-md min-h-[44px] flex items-center">
                  {field.value ? (
                    <span className="text-sm">{field.value}</span>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Not provided</span>
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
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Avatar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img 
                src={profileData.avatar_url} 
                alt="Profile Avatar" 
                className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
              />
              <div>
                <p className="text-sm font-medium">Profile Picture</p>
                <p className="text-xs text-gray-500 break-all">{profileData.avatar_url}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
