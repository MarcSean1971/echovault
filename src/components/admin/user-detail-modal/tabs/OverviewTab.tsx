
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
      {/* User Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
              {profileData?.avatar_url ? (
                <AvatarImage src={profileData.avatar_url} alt={getUserFullName(user)} />
              ) : null}
              <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{getUserFullName(user)}</h2>
                <p className="text-gray-600 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                <p className="text-sm text-gray-500 font-mono">ID: {user.id}</p>
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
        </CardContent>
      </Card>

      {/* Profile Completion Card */}
      {user.has_profile && !user.profile_complete && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-orange-800">Profile Incomplete</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={completionPercentage} className="w-20" />
                    <span className="text-sm font-medium text-orange-800">{completionPercentage}%</span>
                  </div>
                </div>
                <p className="text-sm text-orange-700">
                  Missing required fields: {missingFields.join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Messages Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-blue-600">{activityData?.messagesCount || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-green-600">{activityData?.recipientsCount || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              Last Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-purple-600">
              {user.last_sign_in_at ? (
                format(new Date(user.last_sign_in_at), 'MMM d, yyyy')
              ) : (
                <span className="text-gray-400">Never</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
