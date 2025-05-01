import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { performCheckIn, getNextCheckInDeadline } from "@/services/messages/conditionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Shield, Clock } from "lucide-react";
import { differenceInHours, differenceInMinutes, format } from "date-fns";

export default function CheckIn() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [nextDeadline, setNextDeadline] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  
  useEffect(() => {
    if (!userId) return;
    
    const loadNextDeadline = async () => {
      try {
        const result = await getNextCheckInDeadline(userId);
        setNextDeadline(result.deadline);
      } catch (error) {
        console.error("Error fetching next deadline:", error);
        toast({
          title: "Error",
          description: "Could not load your check-in schedule",
          variant: "destructive",
        });
      }
    };
    
    loadNextDeadline();
    
    // Update the time left every minute
    const interval = setInterval(() => {
      if (nextDeadline) {
        const now = new Date();
        const hours = differenceInHours(nextDeadline, now);
        const minutes = differenceInMinutes(nextDeadline, now) % 60;
        
        if (hours < 0 || minutes < 0) {
          setTimeLeft("Overdue");
        } else {
          setTimeLeft(`${hours}h ${minutes}m`);
        }
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [userId, nextDeadline]);
  
  const handleCheckIn = async () => {
    if (!userId) return;
    
    setIsChecking(true);
    try {
      await performCheckIn(userId, "app");
      
      toast({
        title: "Check-in successful",
        description: "Your check-in has been recorded",
      });
      
      // Reload the next deadline
      const result = await getNextCheckInDeadline(userId);
      setNextDeadline(result.deadline);
    } catch (error) {
      console.error("Error checking in:", error);
      toast({
        title: "Check-in failed",
        description: "There was a problem recording your check-in",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Check-In System</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Dead Man's Switch Check-In
            </CardTitle>
            <CardDescription>
              Check-in to reset the timer on your messages
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Regularly checking in prevents your scheduled messages from being sent 
                when you don't want them to be.
              </p>
              
              {nextDeadline ? (
                <div className="rounded-lg bg-primary/5 p-4 border">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold">Next check-in required by:</p>
                      <p className="text-xl font-bold">{format(nextDeadline, "PPP 'at' p")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Time remaining:</p>
                      <p className="text-xl font-bold">{timeLeft}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p>No active check-in required messages.</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4">
            <Button 
              onClick={handleCheckIn} 
              disabled={isChecking}
              className="w-full sm:w-auto"
              size="lg"
            >
              {isChecking ? "Checking in..." : "Check In Now"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Check-Ins
            </CardTitle>
            <CardDescription>
              Your check-in history and activity
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              View your recent check-ins and activity to ensure your messages stay secure.
            </p>
            
            <div className="space-y-4">
              {/* This would be populated from actual check-in history */}
              <div className="text-sm text-muted-foreground italic">
                Check-in history will be displayed here when available.
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/check-ins")}
              >
                View Full Check-In History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
