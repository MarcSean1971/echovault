
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import { performCheckIn } from "@/services/messages/conditionService";

export default function CheckIn() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [panicMode, setPanicMode] = useState(false);

  const handleCheckIn = async () => {
    if (!userId) return;

    setIsChecking(true);
    try {
      await performCheckIn(userId, "app");
      toast({
        title: "Check-In Successful",
        description: "Your Dead Man's Switch has been reset."
      });
    } catch (error: any) {
      console.error("Check-in failed:", error);
      toast({
        title: "Check-In Failed",
        description: error.message || "Unable to complete check-in",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
      setIsConfirming(false);
    }
  };

  // Simulated panic trigger function
  const handlePanicTrigger = () => {
    if (isConfirming) {
      // Simulate triggering panic message
      toast({
        title: "PANIC MODE ACTIVATED",
        description: "Your emergency messages are being sent immediately.",
        variant: "destructive"
      });
      setPanicMode(true);
      
      // Reset after demonstration
      setTimeout(() => {
        setPanicMode(false);
        setIsConfirming(false);
      }, 5000);
    } else {
      setIsConfirming(true);
      
      // Auto-reset confirmation state if not clicked again
      setTimeout(() => {
        setIsConfirming(false);
      }, 3000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dead Man's Switch Control</h1>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Check-In Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Regular Check-In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Perform a regular check-in to reset your Dead Man's Switch timers. 
              This confirms your well-being to the system.
            </p>
            <Button 
              onClick={handleCheckIn}
              disabled={isChecking || panicMode}
              className="w-full"
            >
              {isChecking ? "Checking In..." : "Check In Now"}
            </Button>
          </CardContent>
        </Card>

        {/* Panic Button Card */}
        <Card className={panicMode ? "border-red-500" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center text-red-500">
              <AlertCircle className="h-5 w-5 mr-2" />
              Emergency Panic Button
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Press this button in emergency situations to immediately trigger your 
              configured emergency messages.
            </p>
            <Button 
              variant={isConfirming ? "destructive" : "outline"}
              onClick={handlePanicTrigger}
              disabled={isChecking || panicMode}
              className="w-full"
            >
              {panicMode ? "MESSAGES SENDING..." : isConfirming ? "CONFIRM EMERGENCY TRIGGER" : "Emergency Panic Button"}
            </Button>
            {isConfirming && (
              <p className="text-red-500 text-sm animate-pulse">
                Click again to confirm emergency trigger
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* This would be populated with real data in a full implementation */}
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <p>Last Check-In:</p>
              <p className="text-sm font-medium">2 hours ago</p>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <p>Next Check-In Required:</p>
              <p className="text-sm font-medium">22 hours remaining</p>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <p>Active Conditions:</p>
              <p className="text-sm font-medium">2 Messages</p>
            </div>
            <div className="flex justify-between items-center py-2">
              <p>Status:</p>
              <p className="text-sm font-medium text-green-500">System Armed and Monitoring</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
