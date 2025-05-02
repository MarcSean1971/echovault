import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useTriggerDashboard } from "@/hooks/useTriggerDashboard";
import { triggerPanicMessage } from "@/services/messages/conditions/panicTriggerService";
import { DashboardSummaryCards } from "@/components/message/dashboard/DashboardSummaryCards";

export default function CheckIn() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [panicMode, setPanicMode] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const {
    conditions,
    nextDeadline,
    lastCheckIn,
    isLoading,
    handleCheckIn
  } = useTriggerDashboard();

  // Find panic trigger messages
  const panicMessages = conditions.filter(c => c.condition_type === 'panic_trigger' && c.active);
  
  // Get the first available panic message or null if none exist
  const panicMessage = panicMessages.length > 0 ? panicMessages[0] : null;

  const onCheckIn = async () => {
    setIsChecking(true);
    try {
      await handleCheckIn();
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

  // Handle panic trigger
  const handlePanicTrigger = async () => {
    if (!userId || !panicMessage) {
      toast({
        title: "Error",
        description: "No panic message is configured",
        variant: "destructive"
      });
      return;
    }

    if (isConfirming) {
      setPanicMode(true);
      try {
        const result = await triggerPanicMessage(userId, panicMessage.message_id);
        if (result.success) {
          toast({
            title: "PANIC MODE ACTIVATED",
            description: "Your emergency messages are being sent immediately.",
            variant: "destructive"
          });
          
          // Refresh the dashboard data after triggering
          setTimeout(() => {
            setPanicMode(false);
            setIsConfirming(false);
            navigate('/messages'); // Redirect to messages page
          }, 3000);
        }
      } catch (error: any) {
        console.error("Error triggering panic message:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to trigger panic message",
          variant: "destructive"
        });
        setPanicMode(false);
        setIsConfirming(false);
      }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Trigger Switch Control</h1>
      </div>

      {/* Display summary cards from DashboardSummaryCards component */}
      <div className="mb-8">
        <DashboardSummaryCards 
          nextDeadline={nextDeadline} 
          lastCheckIn={lastCheckIn}
          conditions={conditions}
          onCheckIn={onCheckIn}
        />
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
              onClick={onCheckIn}
              disabled={isChecking || panicMode || isLoading}
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
              disabled={isChecking || panicMode || !panicMessage || isLoading}
              className="w-full"
            >
              {panicMode ? "MESSAGES SENDING..." : isConfirming ? "CONFIRM EMERGENCY TRIGGER" : "Emergency Panic Button"}
            </Button>
            {isConfirming && (
              <p className="text-red-500 text-sm animate-pulse">
                Click again to confirm emergency trigger
              </p>
            )}
            {!panicMessage && !isLoading && (
              <p className="text-amber-500 text-sm">
                No panic trigger messages configured. Create one in Messages.
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
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <p>Last Check-In:</p>
              <p className="text-sm font-medium">
                {lastCheckIn ? 
                  formatDistanceToNow(new Date(lastCheckIn), { addSuffix: true }) : 
                  "No recent check-ins"}
              </p>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <p>Next Check-In Required:</p>
              <p className="text-sm font-medium">
                {nextDeadline ? 
                  formatDistanceToNow(nextDeadline, { addSuffix: true }) : 
                  "No active deadlines"}
              </p>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <p>Active Conditions:</p>
              <p className="text-sm font-medium">
                {conditions.filter(c => c.active).length} Messages
              </p>
            </div>
            <div className="flex justify-between items-center py-2">
              <p>Status:</p>
              <p className="text-sm font-medium text-green-500">
                {isLoading ? 
                  "Loading..." : 
                  nextDeadline ? "System Armed and Monitoring" : "No active triggers"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
