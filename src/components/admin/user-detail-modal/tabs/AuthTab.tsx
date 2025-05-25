
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, Calendar, Clock, Key, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { AuthUser, UserProfile } from "../types";

interface AuthTabProps {
  user: AuthUser;
  profileData: UserProfile | null;
}

export function AuthTab({ user, profileData }: AuthTabProps) {
  return (
    <div className="space-y-6">
      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                Email Verified
              </span>
              <Badge variant={user.email_confirmed_at ? "default" : "destructive"}>
                {user.email_confirmed_at ? "Yes" : "No"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4 text-green-500" />
                Account Status
              </span>
              <Badge variant="default">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-sm font-medium text-gray-600">Email Address:</span>
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{user.email}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-sm font-medium text-gray-600">User ID:</span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded break-all">{user.id}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.email_confirmed_at ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Email Verified</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Email was verified on {format(new Date(user.email_confirmed_at), 'PPpp')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Email Not Verified</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This user has not confirmed their email address yet. They may have limited access to certain features.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Account Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Account Created</p>
                <p className="text-sm text-blue-600">{format(new Date(user.created_at), 'PPpp')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Last Updated</p>
                <p className="text-sm text-green-600">{format(new Date(user.updated_at), 'PPpp')}</p>
              </div>
            </div>

            {user.last_sign_in_at && (
              <div className="flex items-center gap-4 p-3 border-l-4 border-purple-500 bg-purple-50 rounded-r-lg">
                <Shield className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-800">Last Sign In</p>
                  <p className="text-sm text-purple-600">{format(new Date(user.last_sign_in_at), 'PPpp')}</p>
                </div>
              </div>
            )}

            {profileData && (
              <div className="flex items-center gap-4 p-3 border-l-4 border-orange-500 bg-orange-50 rounded-r-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">Profile Created</p>
                  <p className="text-sm text-orange-600">{format(new Date(profileData.created_at), 'PPpp')}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
