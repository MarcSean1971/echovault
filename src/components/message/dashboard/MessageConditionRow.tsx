
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Message, MessageCondition, MessageDeliveryStatus, TriggerType } from "@/types/message";
import { format } from "date-fns";
import { 
  Clock, 
  Calendar, 
  Users, 
  Bell, 
  Shield, 
  Hourglass 
} from "lucide-react";
import { triggerPanicMessage } from "@/services/messages/conditionService";

interface MessageConditionRowProps {
  condition: MessageCondition;
  message?: Message;
  userId?: string;
  onRefreshConditions: () => void;
}

export function MessageConditionRow({ 
  condition, 
  message, 
  userId,
  onRefreshConditions 
}: MessageConditionRowProps) {
  const navigate = useNavigate();
  
  // Helper function to determine message status
  const getMessageStatus = (condition: MessageCondition): MessageDeliveryStatus => {
    if (!condition.active) return 'cancelled';
    if (condition.delivered) return 'delivered';
    if (condition.triggered) return 'triggered';
    return 'armed';
  };
  
  const getTriggerTypeIcon = (type: TriggerType) => {
    switch (type) {
      case 'no_check_in':
        return <Clock className="h-4 w-4" />;
      case 'regular_check_in':
        return <Bell className="h-4 w-4" />;
      case 'group_confirmation':
        return <Users className="h-4 w-4" />;
      case 'panic_trigger':
        return <Shield className="h-4 w-4" />;
      case 'inactivity_to_recurring':
        return <Hourglass className="h-4 w-4" />;
      case 'inactivity_to_date':
        return <Hourglass className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  
  const getStatusBadge = (status: MessageDeliveryStatus) => {
    switch (status) {
      case 'armed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Armed</Badge>;
      case 'triggered':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Triggered</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Delivered</Badge>;
      case 'viewed':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Viewed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Format trigger description
  const getTriggerDescription = (condition: MessageCondition) => {
    switch (condition.condition_type) {
      case 'no_check_in':
        return `Sends if no check-in within ${condition.hours_threshold} hours`;
      case 'regular_check_in':
        return `Sent on regular schedule every ${condition.hours_threshold} hours`;
      case 'group_confirmation':
        return `Sends after ${condition.confirmation_required} confirmations`;
      case 'panic_trigger':
        return 'Manual panic trigger';
      case 'inactivity_to_recurring':
        return `Sends regularly after ${condition.hours_threshold} hours of inactivity`;
      case 'inactivity_to_date':
        return `Sends on specific date after ${condition.hours_threshold} hours of inactivity`;
      default:
        return 'Unknown trigger type';
    }
  };
  
  const handleTriggerPanic = async () => {
    if (!userId || !condition.message_id) return;
    
    if (confirm("Are you sure you want to trigger this panic message? This cannot be undone.")) {
      try {
        await triggerPanicMessage(userId, condition.message_id);
        toast({
          title: "Panic message triggered",
          description: "Your message has been sent to all recipients",
        });
        
        // Refresh condition data
        onRefreshConditions();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Could not trigger panic message",
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <TableRow key={condition.id}>
      <TableCell className="font-medium">
        {message?.title || "Unknown message"}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {getTriggerTypeIcon(condition.condition_type)}
          <span>{getTriggerDescription(condition)}</span>
        </div>
      </TableCell>
      <TableCell>
        {getStatusBadge(getMessageStatus(condition))}
      </TableCell>
      <TableCell>
        {condition.recipients?.length || 0} recipient(s)
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/message/${condition.message_id}`)}
          >
            View
          </Button>
          {condition.condition_type === 'panic_trigger' && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleTriggerPanic}
            >
              Trigger Now
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
