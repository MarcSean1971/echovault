import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { performCheckIn } from "@/services/messages/conditions/checkInService";
import { toast } from "@/components/ui/use-toast";
import { CheckIn } from "@/types/message";

// Update the mockCheckIns data to include created_at
const mockCheckIns: CheckIn[] = [
  {
    id: "1",
    user_id: "user123",
    created_at: new Date().toISOString(), // Add required property
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    method: "app"
  },
  {
    id: "2",
    user_id: "user123",
    created_at: new Date().toISOString(), // Add required property
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    method: "app"
  },
  {
    id: "3",
    user_id: "user123",
    created_at: new Date().toISOString(), // Add required property
    timestamp: new Date().toISOString(),
    method: "app",
    device_info: "Web browser" 
  }
];

export default function CheckIns() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>(mockCheckIns);
  const { userId } = useAuth();

  useEffect(() => {
    // Simulate fetching check-in data from a database
    // In a real application, you would fetch this data from your database
    // using an API call
    // For now, we'll just use the mock data
    setCheckIns(mockCheckIns);
  }, []);

  const handleCheckIn = async () => {
    if (!userId) {
      toast({
        title: "You must be logged in to check in.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await performCheckIn(userId, "app");
      toast({
        title: "Check-in successful!",
        description: `Checked in via ${result.method} at ${format(
          new Date(result.timestamp),
          "Pp"
        )}`,
      });
    } catch (error: any) {
      toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Recent Check-Ins</CardTitle>
          <Button onClick={handleCheckIn}>
            <Plus className="mr-2 h-4 w-4" />
            Check In Now
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {checkIns.map((checkIn) => (
              <div
                key={checkIn.id}
                className="flex items-center space-x-4 rounded-md border p-4"
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Checked in via {checkIn.method}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(checkIn.timestamp || checkIn.created_at), "Pp")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
