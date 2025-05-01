import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  fetchMessageConditions,
  updateMessageCondition,
  performCheckIn,
  getNextCheckInDeadline,
  triggerPanicMessage
} from "@/services/messages/conditionService";
import { fetchMessages } from "@/services/messages/messageService";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";
import { MessageCondition, Message, MessageDeliveryStatus } from "@/types/message";
import { CheckCircle, AlertCircle, Clock, Calendar, Users, Bell, Shield, Hourglass } from "lucide-react";

export function TriggerDashboard() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conditions, setConditions] = useState<MessageCondition[]>([]);
  const [nextDeadline, setNextDeadline] = useState<Date | null>(null);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) return;
    
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch messages and conditions
        const [messagesData, conditionsData] = await Promise.all([
          fetchMessages(),
          fetchMessageConditions(userId)
        ]);
        
        setMessages(messagesData);
        setConditions(conditionsData);
        
        // Get next check-in deadline
        const { deadline } = await getNextCheckInDeadline(userId);
        setNextDeadline(deadline);
        
        // Use the most recent last_checked date from conditions as the last check-in
        if (conditionsData && conditionsData.length > 0) {
          const mostRecent = conditionsData.reduce(
            (latest, condition) => {
              const lastChecked = new Date(condition.last_checked);
              return lastChecked > latest ? lastChecked : latest;
            },
            new Date(0) // start with epoch
          );
          
          setLastCheckIn(mostRecent.toISOString());
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({
          title: "Error",
          description: "Could not load trigger system data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [userId]);
  
  const handleCheckIn = async () => {
    if (!userId) return;
    
    try {
      await performCheckIn(userId, "app");
      
      // Refresh deadline
      const { deadline } = await getNextCheckInDeadline(userId);
      setNextDeadline(deadline);
      setLastCheckIn(new Date().toISOString());
      
      toast({
        title: "Check-in successful",
        description: "Your dead man's switch has been reset",
      });
    } catch (error) {
      console.error("Error checking in:", error);
      toast({
        title: "Check-in failed",
        description: "Could not perform check-in",
        variant: "destructive",
      });
    }
  };
  
  const getTriggerTypeIcon = (type: string) => {
    switch (type) {
      case 'no_check_in':
        return <Clock className="h-4 w-4" />;
      case 'regular_check_in':
        return <Bell className="h-4 w-4" />;
      case 'scheduled_date':
        return <Calendar className="h-4 w-4" />;
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
  
  // Helper function to determine message status
  const getMessageStatus = (condition: MessageCondition): MessageDeliveryStatus => {
    if (!condition.active) return 'cancelled';
    if (condition.delivered) return 'delivered';
    if (condition.triggered) return 'triggered';
    return 'armed';
  };
  
  // Format trigger description
  const getTriggerDescription = (condition: MessageCondition) => {
    switch (condition.condition_type) {
      case 'no_check_in':
        return `Sends if no check-in within ${condition.hours_threshold} hours`;
      case 'regular_check_in':
        return `Sent on regular schedule every ${condition.hours_threshold} hours`;
      case 'scheduled_date':
        return condition.trigger_date 
          ? `Sends on ${format(new Date(condition.trigger_date), 'PPP')}` 
          : 'Sends on specific date';
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
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Next Check-in Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            {nextDeadline ? (
              <div className="flex flex-col">
                <span className="text-3xl font-bold">
                  {formatDistanceToNow(nextDeadline, { addSuffix: true })}
                </span>
                <span className="text-sm text-muted-foreground">
                  {format(nextDeadline, 'PPpp')}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">No active check-in deadlines</span>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleCheckIn} className="w-full">
              Check In Now
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Last Check-in</CardTitle>
          </CardHeader>
          <CardContent>
            {lastCheckIn ? (
              <div className="flex flex-col">
                <span className="text-3xl font-bold">
                  {formatDistanceToNow(new Date(lastCheckIn), { addSuffix: true })}
                </span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(lastCheckIn), 'PPpp')}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">No recent check-ins</span>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Message Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>Armed:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {conditions.filter(c => getMessageStatus(c) === 'armed').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivered:</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {conditions.filter(c => getMessageStatus(c) === 'delivered').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Triggered:</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {conditions.filter(c => getMessageStatus(c) === 'triggered').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Message Triggers</CardTitle>
          <CardDescription>
            Manage all your message triggers and their delivery conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4 text-center">Loading message triggers...</div>
          ) : conditions.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-muted-foreground">No message triggers set up yet</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => navigate("/create-message")}
              >
                Create Your First Message
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Trigger Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conditions.map(condition => {
                  // Find matching message
                  const message = messages.find(m => m.id === condition.message_id);
                  
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
                              onClick={async () => {
                                if (confirm("Are you sure you want to trigger this panic message? This cannot be undone.")) {
                                  try {
                                    await triggerPanicMessage(userId as string, condition.message_id);
                                    toast({
                                      title: "Panic message triggered",
                                      description: "Your message has been sent to all recipients",
                                    });
                                    
                                    // Refresh condition data
                                    const updatedConditions = await fetchMessageConditions(userId as string);
                                    setConditions(updatedConditions);
                                  } catch (error: any) {
                                    toast({
                                      title: "Error",
                                      description: error.message || "Could not trigger panic message",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            >
                              Trigger Now
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
