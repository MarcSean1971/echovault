
import { useState, useEffect } from "react";
import { MessageCondition, Message } from "@/types/message";
import { armMessage, disarmMessage } from "@/services/messages/conditionService";
import { toast } from "@/components/ui/use-toast";
import { StatusBadge } from "./condition-row/StatusBadge";
import { ConditionActions } from "./condition-row/ConditionActions";
import { ConditionDetails } from "./condition-row/ConditionDetails";

interface MessageConditionRowProps {
  condition: MessageCondition;
  message: Message | undefined;
  userId: string | undefined | null;
  onRefreshConditions: () => void;
}

export function MessageConditionRow({ 
  condition, 
  message, 
  userId, 
  onRefreshConditions 
}: MessageConditionRowProps) {
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
  
  // Handle arming a message
  const handleArm = async () => {
    if (!userId || !condition.id) return;
    
    setIsLoading(true);
    
    try {
      await armMessage(condition.id, userId);
      toast({ title: "Message armed successfully" });
      setStatus("armed");
      onRefreshConditions();
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
      onRefreshConditions();
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
        <StatusBadge status={status as "disarmed" | "armed" | "triggered" | "delivered"} />
      </div>
      
      <ConditionDetails 
        triggerType={condition.trigger_type} 
        nextDeadline={condition.next_deadline} 
      />
      
      <div className="col-span-3">
        <ConditionActions 
          status={status}
          messageId={message?.id}
          isLoading={isLoading}
          onDisarm={handleDisarm}
          onArm={handleArm}
        />
      </div>
    </div>
  );
}
