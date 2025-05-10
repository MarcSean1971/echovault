
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { MessageCondition, TriggerType, Message, MessageDeliveryStatus } from "@/types/message";
import { armMessage, disarmMessage } from "@/services/messages/conditionService";
import { toast } from "@/components/ui/use-toast";
import { Clock, ShieldAlert, Shield, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface MessageConditionRowProps {
  condition: MessageCondition;
  message: Message | undefined;
  onRefresh: () => void;
  userId: string | null;
}

export function MessageConditionRow({ condition, message, onRefresh, userId }: MessageConditionRowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>(condition.active ? "armed" : "disarmed");
  
  // Update status when condition changes
  useEffect(() => {
    let newStatus: string = condition.active ? "armed" : "disarmed";
    
    if (condition.triggered) {
      newStatus = "triggered";
    } else if (condition.delivered) {
      newStatus = "delivered";
    }
    
    setStatus(newStatus);
  }, [condition]);
  
  // Get badge and status text for the current status
  const getBadgeForStatus = () => {
    switch (status) {
      case "disarmed":
        return (
          <Badge variant="outline" className="bg-muted">
            <Shield className="h-3 w-3 mr-1" />
            Disarmed
          </Badge>
        );
      case "armed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Armed
          </Badge>
        );
      case "triggered":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Triggered
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Unknown
          </Badge>
        );
    }
  };
  
  // Format the condition type for display
  const getConditionTypeDisplay = (): string => {
    switch (condition.trigger_type) {
      case "no_check_in":
        return "Deadman's switch";
      case "panic_button":
        return "Panic button";
      case "scheduled":
        return "Scheduled message";
      case "manual_trigger":
        return "Manual trigger";
      case "panic_trigger":
        return "Panic trigger";
      default:
        return condition.trigger_type;
    }
  };
  
  // Get deadline display for the condition
  const getDeadlineDisplay = (): string => {
    if (!condition.next_deadline) {
      return "—";
    }
    
    try {
      return formatDistanceToNow(new Date(condition.next_deadline), { addSuffix: true });
    } catch (e) {
      return "Invalid date";
    }
  };
  
  // Handle arming a message
  const handleArm = async () => {
    if (!userId || !condition.id) return;
    
    setIsLoading(true);
    
    try {
      await armMessage(condition.id, userId);
      toast({ title: "Message armed successfully" });
      setStatus("armed");
      onRefresh();
    } catch (error: any) {
      console.error("Error arming message:", error);
      toast({ 
        title: "Failed to arm message", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle disarming a message
  const handleDisarm = async () => {
    if (!userId || !condition.id) return;
    
    setIsLoading(true);
    
    try {
      await disarmMessage(condition.id);
      toast({ title: "Message disarmed successfully" });
      setStatus("disarmed");
      onRefresh();
    } catch (error: any) {
      console.error("Error disarming message:", error);
      toast({ 
        title: "Failed to disarm message", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-0">
      <div className="col-span-3 font-medium truncate">
        {message?.title || "Unknown message"}
      </div>
      
      <div className="col-span-2">
        {getBadgeForStatus()}
      </div>
      
      <div className="col-span-2 text-sm">
        {getConditionTypeDisplay()}
      </div>
      
      <div className="col-span-2 text-sm">
        {getDeadlineDisplay()}
      </div>
      
      <div className="col-span-3 flex justify-end gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => message && window.location.href = `/message/${message.id}`}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.muted}`}
        >
          Details
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
        
        {status === "armed" ? (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleDisarm}
            disabled={isLoading}
            className={`${HOVER_TRANSITION} bg-amber-50 hover:bg-amber-100 text-amber-700`}
          >
            <Shield className="h-3 w-3 mr-1" />
            Disarm
          </Button>
        ) : (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleArm}
            disabled={isLoading}
            className={`${HOVER_TRANSITION} bg-green-50 hover:bg-green-100 text-green-700`}
          >
            <ShieldAlert className="h-3 w-3 mr-1" />
            Arm
          </Button>
        )}
      </div>
    </div>
  );
}
