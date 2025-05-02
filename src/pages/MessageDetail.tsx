
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
  ArrowLeft, Edit, Trash2, MessageSquare, File, Video, 
  Bell, BellOff, CalendarDays, Users, ShieldCheck, Info,
  ChevronDown, ChevronUp
} from "lucide-react";
import { MessageTimer } from "@/components/message/MessageTimer";
import { Message } from "@/types/message";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  getConditionByMessageId,
  getMessageDeadline,
  armMessage,
  disarmMessage
} from "@/services/messages/conditionService";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [showMetadata, setShowMetadata] = useState(false);
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
  
  const getMessageTypeIcon = () => {
    if (!message) return null;
    
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
          <Button onClick={() => navigate("/messages")}>
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-4 md:py-8 space-y-4">
      {/* Mobile header with back button and status */}
      <div className="flex items-center justify-between gap-4 mb-2 md:mb-0">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/messages")}
          size="sm"
          className="hover:bg-transparent p-0 md:p-2"
        >
          <ArrowLeft className="mr-1 h-5 w-5" />
          <span className="md:block">Back</span>
        </Button>
        
        {isMobile && conditionId && (
          <div>
            {isArmed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisarmMessage}
                disabled={isActionLoading}
                className="text-green-600 border-green-600"
              >
                <BellOff className="h-4 w-4 mr-1" /> Disarm
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleArmMessage}
                disabled={isActionLoading}
                className="text-destructive border-destructive"
              >
                <Bell className="h-4 w-4 mr-1" /> Arm
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Main content with responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        {/* Mobile countdown timer - only shown when armed */}
        {isMobile && isArmed && deadline && (
          <div className="col-span-full bg-destructive/5 border border-destructive p-3 rounded-lg">
            <p className="text-sm font-medium text-destructive mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" /> 
              Delivery countdown
            </p>
            <MessageTimer deadline={deadline} isArmed={isArmed} />
          </div>
        )}
        
        {/* Main message card */}
        <div className="col-span-full lg:col-span-8 lg:order-1">
          <Card className={`${isArmed ? 'border-destructive/30 shadow-md' : ''}`}>
            <div className="p-4 md:p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getMessageTypeIcon()}
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
              {!isMobile && isArmed && deadline && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3">
                  <p className="text-sm font-medium text-destructive mb-2">Delivery countdown</p>
                  <MessageTimer deadline={deadline} isArmed={isArmed} />
                </div>
              )}
              
              {/* Message tabs */}
              <Tabs defaultValue="content" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="mb-4 grid w-full grid-cols-2">
                  <TabsTrigger value="content">Message</TabsTrigger>
                  <TabsTrigger value="settings">Delivery</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-4 pt-2">
                  {isArmed && (
                    <div className="mb-4 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-md dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800 text-sm">
                      <p className="flex items-center">
                        <Info className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        <span>This message is armed and will be delivered according to your settings. Disarm it to make changes.</span>
                      </p>
                    </div>
                  )}
                  
                  {message.message_type === 'text' ? (
                    <div className="whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base">
                      {message.content || <span className="text-muted-foreground italic">No content</span>}
                    </div>
                  ) : (
                    <div className="text-center py-12 border rounded-md">
                      <p className="text-muted-foreground mb-4">
                        {message.message_type === 'voice' 
                          ? 'Voice message playback'
                          : 'Video message playback'}
                      </p>
                      <p className="text-sm">
                        This feature is coming soon!
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-6 pt-2">
                  {condition ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-md font-medium mb-2">Delivery Method</h3>
                        <div className="bg-muted/50 p-3 md:p-4 rounded-md">
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-medium">Type:</span>
                              <span className="col-span-2">{renderConditionType()}</span>
                            </div>
                            
                            {condition.condition_type === 'no_check_in' && (
                              <div className="grid grid-cols-3 gap-2">
                                <span className="font-medium">Check-in period:</span>
                                <span className="col-span-2">
                                  {condition.hours_threshold} hours
                                  {condition.minutes_threshold ? ` ${condition.minutes_threshold} minutes` : ''}
                                </span>
                              </div>
                            )}
                            
                            {condition.reminder_hours && condition.reminder_hours.length > 0 && (
                              <div className="grid grid-cols-3 gap-2">
                                <span className="font-medium">Reminders:</span>
                                <span className="col-span-2">
                                  {condition.reminder_hours.map((hours: number) => `${hours}h`).join(', ')} before deadline
                                </span>
                              </div>
                            )}
                            
                            {condition.recurring_pattern && (
                              <div className="grid grid-cols-3 gap-2">
                                <span className="font-medium">Recurring:</span>
                                <span className="col-span-2">
                                  {condition.recurring_pattern.type} 
                                  {condition.recurring_pattern.interval > 1 ? 
                                    ` (every ${condition.recurring_pattern.interval} ${condition.recurring_pattern.type.slice(0, -2)}s)` : 
                                    ''}
                                </span>
                              </div>
                            )}
                            
                            {condition.trigger_date && (
                              <div className="grid grid-cols-3 gap-2">
                                <span className="font-medium">Scheduled date:</span>
                                <span className="col-span-2">
                                  {formatDate(condition.trigger_date)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        {condition.expiry_hours > 0 && (
                          <div className="p-3 rounded-md bg-muted/30 text-sm">
                            <p className="font-medium mb-1">Message Expiry</p>
                            <p className="text-muted-foreground">
                              This message will expire {condition.expiry_hours} hours after delivery.
                            </p>
                          </div>
                        )}
                        
                        {condition.unlock_delay_hours > 0 && (
                          <div className="p-3 rounded-md bg-muted/30 text-sm">
                            <p className="font-medium mb-1">Delay Settings</p>
                            <p className="text-muted-foreground">
                              Recipients will need to wait {condition.unlock_delay_hours} hours after delivery to view this message.
                            </p>
                          </div>
                        )}
                        
                        {condition.pin_code && (
                          <div className="p-3 rounded-md bg-muted/30 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium">PIN Protection</p>
                            </div>
                            <p className="text-muted-foreground">
                              Recipients will need to enter a PIN to access this message.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No delivery settings configured for this message.</p>
                  )}
                </TabsContent>
              </Tabs>
              
              {/* Mobile - Show metadata toggle */}
              <div className="md:hidden border-t pt-3 mt-2">
                <button 
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="text-sm flex items-center w-full justify-between text-muted-foreground"
                >
                  <span>Message details</span>
                  {showMetadata ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {showMetadata && (
                  <div className="pt-3 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Created</p>
                      <p className="text-sm">{formatDate(message.created_at)}</p>
                    </div>
                    
                    {message.updated_at !== message.created_at && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Last updated</p>
                        <p className="text-sm">{formatDate(message.updated_at)}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Recipients</p>
                      {renderRecipients()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
        
        {/* Sidebar - Desktop only */}
        <div className="lg:col-span-4 lg:order-2 space-y-4 hidden lg:block">
          {/* Status card */}
          <Card className={`${isArmed ? 'border-destructive border-2 shadow-md' : ''}`}>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-medium">Status</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${isArmed ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                  {isArmed ? 'Armed' : 'Disarmed'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium mr-1">Created:</span> 
                  {formatDate(message.created_at)}
                </div>
                
                <div className="flex items-center text-sm">
                  <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium mr-1">Type:</span>
                  {renderConditionType()}
                </div>
              </div>
              
              {conditionId && (
                <div className="pt-2">
                  {isArmed ? (
                    <Button
                      variant="outline"
                      onClick={handleDisarmMessage}
                      disabled={isActionLoading}
                      className="w-full text-green-600 hover:bg-green-50 hover:text-green-700"
                    >
                      <BellOff className="h-4 w-4 mr-2" /> Disarm Message
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleArmMessage}
                      disabled={isActionLoading}
                      className="w-full text-destructive hover:bg-destructive/10"
                    >
                      <Bell className="h-4 w-4 mr-2" /> Arm Message
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Recipients card */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Recipients</h3>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              {renderRecipients()}
            </CardContent>
          </Card>
          
          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/message/${message.id}/edit`)}
              disabled={isArmed}
              className="w-full justify-start"
              title={isArmed ? "Disarm message to edit" : "Edit"}
            >
              <Edit className="h-4 w-4 mr-2" /> Edit Message
            </Button>
            
            {/* Delete with confirmation */}
            <Sheet open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={isArmed}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Message
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Are you sure?</SheetTitle>
                  <SheetDescription>
                    This action cannot be undone. This will permanently delete your message.
                  </SheetDescription>
                </SheetHeader>
                <SheetFooter className="flex-row justify-end gap-2 mt-6">
                  <SheetClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </SheetClose>
                  <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      {/* Mobile bottom action sheet */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t z-10 flex justify-center">
          <div className="flex gap-2 w-full max-w-md">
            <Button
              variant="outline"
              onClick={() => setShowDetailsSheet(true)}
              className="flex-1"
            >
              <Info className="h-4 w-4 mr-1" /> Details
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate(`/message/${message.id}/edit`)}
              disabled={isArmed}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isArmed}
              className="text-destructive border-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Mobile details sheet */}
      {isMobile && (
        <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
          <SheetContent side="bottom" className="h-[80vh] max-h-[80vh] overflow-auto">
            <SheetHeader className="text-left pb-0">
              <SheetTitle>Message Details</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6 py-4">
              {/* Status card */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-md font-medium">Status</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${isArmed ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                    {isArmed ? 'Armed' : 'Disarmed'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-1">Created:</span> 
                    {formatDate(message.created_at)}
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-1">Type:</span>
                    {renderConditionType()}
                  </div>
                </div>
              </div>
              
              <div className="h-px bg-border w-full"></div>
              
              {/* Recipients */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium">Recipients</h3>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                {renderRecipients()}
              </div>
              
              <div className="h-px bg-border w-full"></div>
              
              {/* Arm/Disarm action */}
              {conditionId && (
                <div className="pt-2">
                  {isArmed ? (
                    <Button
                      variant="outline"
                      onClick={handleDisarmMessage}
                      disabled={isActionLoading}
                      className="w-full text-green-600 border-green-600"
                    >
                      <BellOff className="h-4 w-4 mr-2" /> Disarm Message
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleArmMessage}
                      disabled={isActionLoading}
                      className="w-full text-destructive border-destructive"
                    >
                      <Bell className="h-4 w-4 mr-2" /> Arm Message
                    </Button>
                  )}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
      
      {/* Add spacing at bottom on mobile to account for fixed action bar */}
      {isMobile && <div className="h-16"></div>}
    </div>
  );
}
