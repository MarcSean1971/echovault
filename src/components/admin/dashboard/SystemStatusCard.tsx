
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SystemStatusCard() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>System Status</CardTitle>
        <CardDescription>Real-time system performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Database Status</span>
            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
              Healthy
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">API Services</span>
            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
              Operational
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Email Delivery</span>
            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Storage Service</span>
            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
              Online
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
