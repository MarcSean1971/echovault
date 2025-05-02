
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MessageSquare, Users, Shield, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getNextCheckInDeadline } from "@/services/messages/conditionService";

export default function Dashboard() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [checkInStatus, setCheckInStatus] = useState({
    nextCheckIn: "No deadlines",
    isWarning: false,
    hoursRemaining: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    const loadCheckInData = async () => {
      try {
        const { deadline } = await getNextCheckInDeadline(userId);
        
        if (deadline) {
          const now = new Date();
          const diff = deadline.getTime() - now.getTime();
          const hoursRemaining = Math.max(0, diff / (1000 * 60 * 60));
          
          let timeString = "";
          if (hoursRemaining < 1) {
            timeString = `${Math.round(hoursRemaining * 60)} minutes`;
          } else {
            const days = Math.floor(hoursRemaining / 24);
            const hours = Math.floor(hoursRemaining % 24);
            timeString = days > 0 ? 
              `${days} days, ${hours} hours` : 
              `${hours} hours`;
          }
          
          setCheckInStatus({
            nextCheckIn: timeString,
            isWarning: hoursRemaining < 6, // Warning if less than 6 hours
            hoursRemaining
          });
        }
      } catch (error) {
        console.error("Error loading check-in data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCheckInData();
  }, [userId]);

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
            {checkInStatus.isWarning ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <Clock className="h-5 w-5 text-green-500" />
            )}
            Dead Man's Switch Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading check-in status...</p>
          ) : (
            <>
              <p>
                {checkInStatus.isWarning 
                  ? "Warning: Check-in required soon!" 
                  : "Your status is active and secure."}
              </p>
              <p className="font-semibold mt-2">
                Next check-in required in: {checkInStatus.nextCheckIn}
              </p>
            </>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button 
            onClick={() => navigate('/check-in')}
            disabled={isLoading}
          >
            Check In Now
          </Button>
          {checkInStatus.isWarning && (
            <Button 
              variant="destructive" 
              onClick={() => navigate('/check-in')}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <AlertCircle className="h-4 w-4" /> Emergency Options
            </Button>
          )}
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

        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/check-in')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Dead Man's Switch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Check in and manage your triggers</p>
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
