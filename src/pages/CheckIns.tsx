
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { performCheckIn } from "@/services/messages/conditions/checkInService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { CheckIn } from "@/types/message";

export default function CheckIns() {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  
  // Mock data for recent check-ins
  useEffect(() => {
    // This would be replaced by a real API call in production
    const mockCheckIns: CheckIn[] = [
      {
        id: "1",
        user_id: userId || "",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        method: "app"
      },
      {
        id: "2",
        user_id: userId || "",
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        method: "sms"
      },
      {
        id: "3",
        user_id: userId || "",
        created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        method: "app",
        device_info: "iPhone"
      }
    ];
    
    setRecentCheckIns(mockCheckIns);
  }, [userId]);
  
  const handleCheckIn = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to check in",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await performCheckIn(userId, "app");
      
      if (result.success) {
        // Add this check-in to our list
        const newCheckIn: CheckIn = {
          id: Math.random().toString(36).substring(7),
          user_id: userId,
          created_at: result.timestamp,
          timestamp: result.timestamp,
          method: result.method
        };
        
        setRecentCheckIns([newCheckIn, ...recentCheckIns]);
        
        toast({
          title: "Check-in Successful",
          description: `Updated ${result.conditions_updated} active conditions`,
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error("Check-in error:", error);
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to perform check-in",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Check-In System</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-medium mb-4">Manual Check-In</h2>
            <p className="text-muted-foreground mb-6">
              Click the button below to check-in and reset your deadman's switch timers.
            </p>
            <Button 
              onClick={handleCheckIn} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Checking In...
                </>
              ) : "Check In Now"}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-medium mb-4">Recent Check-Ins</h2>
            {recentCheckIns.length > 0 ? (
              <div className="space-y-3">
                {recentCheckIns.map((checkIn) => (
                  <div key={checkIn.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                    <div>
                      <p className="font-medium">{new Date(checkIn.created_at).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Method: {checkIn.method}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent check-ins found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
