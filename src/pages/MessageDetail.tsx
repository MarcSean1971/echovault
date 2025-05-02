
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { 
  MessageSquare, File, Video
} from "lucide-react";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { 
  getConditionByMessageId,
  getMessageDeadline,
  armMessage,
  disarmMessage
} from "@/services/messages/conditionService";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageHeader } from "@/components/message/detail/MessageHeader";
import { MessageContent } from "@/components/message/detail/MessageContent";
import { MessageDeliverySettings } from "@/components/message/detail/MessageDeliverySettings";
import { MessageMetadata } from "@/components/message/detail/MessageMetadata";
import { MessageDetailsSheet } from "@/components/message/detail/MessageDetailsSheet";
import { MessageActionFooter } from "@/components/message/detail/MessageActionFooter";
import { MessageSidebar } from "@/components/message/detail/MessageSidebar";
import { MobileTimerAlert } from "@/components/message/detail/MobileTimerAlert";
import { DesktopTimerAlert } from "@/components/message/detail/DesktopTimerAlert";
import { Message } from "@/types/message";

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isArmed, setIsArmed] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [conditionId, setConditionId] = useState<string | null>(null);
  const [condition, setCondition] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("content");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!userId || !id) return;
    
    const fetchMessage = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        setMessage(data as Message);
        
        // Check if message has a condition and if it's armed
        const conditionData = await getConditionByMessageId(id);
        if (conditionData) {
          setCondition(conditionData);
          setIsArmed(conditionData.active);
          setConditionId(conditionData.id);
          
          if (conditionData.active) {
            const deadlineDate = await getMessageDeadline(conditionData.id);
            setDeadline(deadlineDate);
          }
        }
      } catch (error: any) {
        console.error("Error fetching message:", error);
        toast({
          title: "Error",
          description: "Failed to load the message",
          variant: "destructive"
        });
        navigate("/messages");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessage();
  }, [userId, id, navigate]);
  
  const handleDelete = async () => {
    if (!message) return;
    setShowDeleteConfirm(false);
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', message.id);
        
      if (error) throw error;
      
      toast({
        title: "Message deleted",
        description: "Your message has been permanently deleted",
      });
      
      navigate("/messages");
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete the message",
        variant: "destructive"
      });
    }
  };
  
  const handleArmMessage = async () => {
    if (!conditionId) return;
    
    setIsActionLoading(true);
    try {
      await armMessage(conditionId);
      setIsArmed(true);
      
      // Get updated deadline
      const deadlineDate = await getMessageDeadline(conditionId);
      setDeadline(deadlineDate);
      
      toast({
        title: "Message armed",
        description: "Your message has been armed and will trigger according to your settings",
      });
    } catch (error) {
      console.error("Error arming message:", error);
      toast({
        title: "Failed to arm message",
        description: "There was a problem arming your message",
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };
  
  const handleDisarmMessage = async () => {
    if (!conditionId) return;
    
    setIsActionLoading(true);
    try {
      await disarmMessage(conditionId);
      setIsArmed(false);
      setDeadline(null);
      
      toast({
        title: "Message disarmed",
        description: "Your message has been disarmed and will not trigger",
      });
    } catch (error) {
      console.error("Error disarming message:", error);
      toast({
        title: "Failed to disarm message",
        description: "There was a problem disarming your message",
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const renderConditionType = () => {
    if (!condition) return "Not set";
    
    switch (condition.condition_type) {
      case 'no_check_in':
        return "Dead Man's Switch";
      case 'panic_trigger':
        return "Panic Trigger";
      case 'inactivity_to_date':
        return "Scheduled Delivery";
      case 'inactivity_to_recurring':
        return "Recurring Delivery";
      default:
        return condition.condition_type.replace(/_/g, ' ');
    }
  };

  const renderRecipients = () => {
    if (!condition?.recipients || condition.recipients.length === 0) {
      return <p className="text-muted-foreground text-sm">No recipients</p>;
    }

    return (
      <div className="space-y-2">
        {condition.recipients.map((recipient: any, index: number) => (
          <div key={index} className="flex items-center text-sm">
            <span className="font-medium">{recipient.name}</span>
            <span className="text-muted-foreground ml-2 text-xs">({recipient.email})</span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-muted rounded-md mx-auto mb-4"></div>
            <div className="h-4 w-32 bg-muted rounded-md mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Message not found</h1>
          <button onClick={() => navigate("/messages")}>
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-4 md:py-8 space-y-4">
      {/* Header with back button and status */}
      <MessageHeader 
        message={message} 
        isArmed={isArmed} 
        isActionLoading={isActionLoading}
        handleDisarmMessage={handleDisarmMessage}
        handleArmMessage={handleArmMessage}
      />
      
      {/* Main content with responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        {/* Mobile countdown timer - only shown when armed */}
        {isMobile && (
          <MobileTimerAlert deadline={deadline} isArmed={isArmed} />
        )}
        
        {/* Main message card */}
        <div className="col-span-full lg:col-span-8 lg:order-1">
          <Card className={`${isArmed ? 'border-destructive/30 shadow-md' : ''}`}>
            <div className="p-4 md:p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {(() => {
                      switch (message.message_type) {
                        case 'text':
                          return <MessageSquare className="h-5 w-5" />;
                        case 'voice':
                          return <File className="h-5 w-5" />;
                        case 'video':
                          return <Video className="h-5 w-5" />;
                        default:
                          return <MessageSquare className="h-5 w-5" />;
                      }
                    })()}
                    <h1 className="text-xl md:text-2xl font-semibold">{message.title}</h1>
                  </div>
                  
                  {/* Desktop - Last updated */}
                  <p className="text-xs text-muted-foreground hidden md:block">
                    {message.updated_at !== message.created_at ? 
                      `Last updated: ${formatDate(message.updated_at)}` : 
                      `Created: ${formatDate(message.created_at)}`}
                  </p>
                </div>
                
                {/* Desktop status badge */}
                <div className="hidden md:block">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${isArmed ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                    {isArmed ? 'Armed' : 'Disarmed'}
                  </div>
                </div>
              </div>
              
              {/* Desktop - Timer */}
              {!isMobile && (
                <DesktopTimerAlert deadline={deadline} isArmed={isArmed} />
              )}
              
              {/* Message tabs */}
              <Tabs defaultValue="content" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="mb-4 grid w-full grid-cols-2">
                  <TabsTrigger value="content">Message</TabsTrigger>
                  <TabsTrigger value="settings">Delivery</TabsTrigger>
                </TabsList>
                
                <MessageContent message={message} isArmed={isArmed} />
                <MessageDeliverySettings 
                  condition={condition} 
                  renderConditionType={renderConditionType}
                  formatDate={formatDate}
                />
              </Tabs>
              
              {/* Mobile - Show metadata toggle */}
              <MessageMetadata 
                message={message} 
                formatDate={formatDate} 
                renderRecipients={renderRecipients} 
              />
            </div>
          </Card>
        </div>
        
        {/* Sidebar - Desktop only */}
        <MessageSidebar 
          message={message}
          isArmed={isArmed}
          conditionId={conditionId}
          isActionLoading={isActionLoading}
          formatDate={formatDate}
          renderConditionType={renderConditionType}
          renderRecipients={renderRecipients}
          handleDisarmMessage={handleDisarmMessage}
          handleArmMessage={handleArmMessage}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          handleDelete={handleDelete}
        />
      </div>
      
      {/* Mobile bottom action sheet and delete confirmation */}
      {isMobile && (
        <MessageActionFooter 
          messageId={message.id}
          isArmed={isArmed}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          setShowDetailsSheet={setShowDetailsSheet}
          handleDelete={handleDelete}
        />
      )}
      
      {/* Mobile details sheet */}
      {isMobile && (
        <MessageDetailsSheet 
          showDetailsSheet={showDetailsSheet}
          setShowDetailsSheet={setShowDetailsSheet}
          formatDate={formatDate}
          message={message}
          renderRecipients={renderRecipients}
          renderConditionType={renderConditionType}
          isArmed={isArmed}
          conditionId={conditionId}
          isActionLoading={isActionLoading}
          handleDisarmMessage={handleDisarmMessage}
          handleArmMessage={handleArmMessage}
        />
      )}
      
      {/* Add spacing at bottom on mobile to account for fixed action bar */}
      {isMobile && <div className="h-16"></div>}
    </div>
  );
}
