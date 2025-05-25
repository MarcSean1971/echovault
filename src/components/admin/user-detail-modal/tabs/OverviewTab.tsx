
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Mail, Calendar, Activity, Users, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { AuthUser, UserProfile, ActivityData } from "../types";
import { getUserInitials, getUserFullName, getMissingFields, getProfileCompletionPercentage } from "../utils";

interface OverviewTabProps {
  user: AuthUser;
  profileData: UserProfile | null;
  activityData: ActivityData | null;
  loading: boolean;
}

export function OverviewTab({ user, profileData, activityData, loading }: OverviewTabProps) {
  const missingFields = getMissingFields(user, profileData);
  const completionPercentage = getProfileCompletionPercentage(user, profileData);

  const getProfileStatusBadge = () => {
    if (!user?.has_profile) {
      return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />No Profile</Badge>;
    } else if (user.profile_complete) {
      return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Complete</Badge>;
    } else {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Incomplete</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-lg p-6 border shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg flex-shrink-0">
            {profileData?.avatar_url ? (
              <AvatarImage src={profileData.avatar_url} alt={getUserFullName(user)} />
            ) : null}
            <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3 min-w-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 truncate">{getUserFullName(user)}</h2>
              <div className="flex items-center gap-1 text-gray-600 mt-1">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-1">ID: {user.id}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant={user.email_confirmed_at ? "default" : "destructive"} className="gap-1">
                {user.email_confirmed_at ? (
                  <><CheckCircle className="h-3 w-3" />Verified</>
                ) : (
                  <><XCircle className="h-3 w-3" />Unverified</>
                )}
              </Badge>
              {getProfileStatusBadge()}
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                Joined {format(new Date(user.created_at), 'MMM yyyy')}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Alert */}
      {user.has_profile && !user.profile_complete && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-orange-800">Profile Incomplete</h4>
                <span className="text-sm font-medium text-orange-800">{completionPercentage}%</span>
              </div>
              <p className="text-sm text-orange-700">
                Missing: {missingFields.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Activity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Messages</p>
                {loading ? (
                  <div className="animate-pulse h-6 bg-gray-200 rounded w-8"></div>
                ) : (
                  <p className="text-2xl font-bold text-blue-600">{activityData?.messagesCount || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Recipients</p>
                {loading ? (
                  <div className="animate-pulse h-6 bg-gray-200 rounded w-8"></div>
                ) : (
                  <p className="text-2xl font-bold text-green-600">{activityData?.recipientsCount || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Last Active</p>
                <p className="text-lg font-semibold text-purple-600">
                  {user.last_sign_in_at ? (
                    format(new Date(user.last_sign_in_at), 'MMM d')
                  ) : (
                    <span className="text-gray-400">Never</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
