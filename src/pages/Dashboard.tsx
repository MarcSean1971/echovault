
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, File, MessageSquare, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const checkInStatus = {
    nextCheckIn: "2 days, 5 hours",
    isWarning: false
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your EchoVault</h1>
        <Button variant="outline" onClick={() => console.log("Profile")}>My Profile</Button>
      </div>

      {/* Check-in Status */}
      <Card className={`mb-8 ${checkInStatus.isWarning ? "border-red-500" : "border-green-500"}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Check-in Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            {checkInStatus.isWarning 
              ? "Warning: Check-in required soon!" 
              : "Your status is active and secure."}
          </p>
          <p className="font-semibold mt-2">
            Next check-in required in: {checkInStatus.nextCheckIn}
          </p>
        </CardContent>
        <CardFooter>
          <Button>Check In Now</Button>
        </CardFooter>
      </Card>

      {/* Quick Actions */}
      <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/messages')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Create and manage your secure messages</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/files')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Upload and manage your secure files</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/recipients')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage your trusted contacts</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b">
              <p>You created a new message</p>
              <p className="text-sm text-muted-foreground">2 hours ago</p>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <p>You uploaded a new file</p>
              <p className="text-sm text-muted-foreground">Yesterday</p>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <p>You added a new recipient</p>
              <p className="text-sm text-muted-foreground">3 days ago</p>
            </div>
            <div className="flex justify-between items-center py-2">
              <p>You completed a check-in</p>
              <p className="text-sm text-muted-foreground">1 week ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
