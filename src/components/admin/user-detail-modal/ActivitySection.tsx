
import { Clock } from "lucide-react";
import { ActivityData } from "./types";

interface ActivitySectionProps {
  loading: boolean;
  activityData: ActivityData | null;
}

export function ActivitySection({ loading, activityData }: ActivitySectionProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-pulse text-primary font-medium">Loading activity data...</div>
      </div>
    );
  }

  if (!activityData) return null;

  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Clock className="h-4 w-4" />
        User Activity
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md border p-4 text-center">
          <p className="text-sm text-muted-foreground">Messages</p>
          <p className="text-2xl font-bold">{activityData.messagesCount}</p>
        </div>
        <div className="rounded-md border p-4 text-center">
          <p className="text-sm text-muted-foreground">Recipients</p>
          <p className="text-2xl font-bold">{activityData.recipientsCount}</p>
        </div>
      </div>
    </div>
  );
}
