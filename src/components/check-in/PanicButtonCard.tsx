
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { triggerPanicMessage } from "@/services/messages/conditions/panicTriggerService";
import { MessageCondition } from "@/types/message";
import { useNavigate } from "react-router-dom";

interface PanicButtonCardProps {
  userId: string | undefined;
  panicMessage: MessageCondition | null;
  isChecking: boolean;
  isLoading: boolean;
}

export function PanicButtonCard({ userId, panicMessage, isChecking, isLoading }: PanicButtonCardProps) {
  const navigate = useNavigate();
  const [panicMode, setPanicMode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

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
  );
}
