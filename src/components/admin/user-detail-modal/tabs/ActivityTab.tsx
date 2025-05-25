
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, MessageSquare, Users, TrendingUp, BarChart3 } from "lucide-react";
import { AuthUser, ActivityData } from "../types";

interface ActivityTabProps {
  user: AuthUser;
  activityData: ActivityData | null;
  loading: boolean;
}

export function ActivityTab({ user, activityData, loading }: ActivityTabProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="animate-pulse h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Messages Sent",
      value: activityData?.messagesCount || 0,
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Recipients",
      value: activityData?.recipientsCount || 0,
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Activity Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div key={stat.title} className={`p-4 rounded-lg border ${stat.bgColor} ${stat.borderColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Messages Activity */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                Message Activity
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Messages</p>
                  <p className="text-xl font-semibold text-blue-600">{activityData?.messagesCount || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Average per Month</p>
                  <p className="text-xl font-semibold text-blue-600">
                    {activityData?.messagesCount ? Math.round(activityData.messagesCount / 12) : 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Recipients Activity */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                Recipients & Contacts
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Recipients</p>
                  <p className="text-xl font-semibold text-green-600">{activityData?.recipientsCount || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Recipients per Message</p>
                  <p className="text-xl font-semibold text-green-600">
                    {activityData?.messagesCount && activityData?.recipientsCount 
                      ? Math.round(activityData.recipientsCount / activityData.messagesCount) 
                      : 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Engagement Level */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Engagement Level
              </h4>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">User Activity Level</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {activityData?.messagesCount === 0 ? 'Inactive' :
                       activityData?.messagesCount && activityData.messagesCount < 5 ? 'Low' :
                       activityData?.messagesCount && activityData.messagesCount < 20 ? 'Medium' : 'High'}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State for No Activity */}
      {activityData?.messagesCount === 0 && activityData?.recipientsCount === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-amber-800 mb-2">No Activity Yet</h3>
            <p className="text-amber-700">
              This user hasn't sent any messages or added any recipients yet. They may be new to the platform or haven't started using the features.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
