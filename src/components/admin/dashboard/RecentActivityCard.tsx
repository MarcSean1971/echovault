
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RecentActivityCard() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest system events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-3 py-1">
            <p className="text-sm">User account created</p>
            <p className="text-xs text-muted-foreground">2 hours ago</p>
          </div>
          <div className="border-l-4 border-green-500 pl-3 py-1">
            <p className="text-sm">Message delivered successfully</p>
            <p className="text-xs text-muted-foreground">5 hours ago</p>
          </div>
          <div className="border-l-4 border-amber-500 pl-3 py-1">
            <p className="text-sm">Check-in reminder sent</p>
            <p className="text-xs text-muted-foreground">Yesterday</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-3 py-1">
            <p className="text-sm">System update completed</p>
            <p className="text-xs text-muted-foreground">2 days ago</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
