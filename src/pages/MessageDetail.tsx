
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, MessageSquare, File, Video, Bell, BellOff } from "lucide-react";
import { MessageTimer } from "@/components/message/MessageTimer";
import { Message } from "@/types/message";
import { 
  getConditionByMessageId,
  getMessageDeadline,
  armMessage,
  disarmMessage
} from "@/services/messages/conditionService";

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
        const condition = await getConditionByMessageId(id);
        if (condition) {
          setIsArmed(condition.active);
          setConditionId(condition.id);
          
          if (condition.active) {
            const deadlineDate = await getMessageDeadline(condition.id);
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
    if (!message || !confirm("Are you sure you want to delete this message?")) return;
    
    if (isArmed) {
      toast({
        title: "Cannot delete armed message",
        description: "Please disarm the message first",
        variant: "destructive"
      });
      return;
    }
    
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <p>Loading message...</p>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="container mx-auto px-4 py-8">
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
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/messages")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Messages
      </Button>
      
      <Card className={`max-w-3xl mx-auto ${isArmed ? 'border-destructive border-2' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {getMessageTypeIcon()}
                <CardTitle className="text-2xl">{message.title}</CardTitle>
                
                {isArmed && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                    Armed
                  </span>
                )}
              </div>
              <CardDescription>
                Created: {formatDate(message.created_at)}
                {message.updated_at !== message.created_at && (
                  <> • Updated: {formatDate(message.updated_at)}</>
                )}
              </CardDescription>
              
              {isArmed && deadline && (
                <div className="mt-2">
                  <MessageTimer deadline={deadline} isArmed={isArmed} />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {conditionId && (
                isArmed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisarmMessage}
                    disabled={isActionLoading}
                    className="text-green-600 hover:bg-green-50 hover:text-green-700"
                  >
                    <BellOff className="h-4 w-4 mr-1" /> Disarm
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleArmMessage}
                    disabled={isActionLoading}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Bell className="h-4 w-4 mr-1" /> Arm
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/message/${message.id}/edit`)}
                disabled={isArmed}
                title={isArmed ? "Disarm message to edit" : "Edit"}
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                disabled={isArmed}
                title={isArmed ? "Disarm message to delete" : "Delete"}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isArmed && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-200 rounded-md dark:bg-red-900/30 dark:text-red-200 dark:border-red-800">
              <p className="text-sm">
                This message is currently armed. If triggered, it will be delivered according to your settings.
                To make changes, disarm the message first.
              </p>
            </div>
          )}
          
          {message.message_type === 'text' ? (
            <div className="whitespace-pre-wrap prose dark:prose-invert max-w-none">
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
        </CardContent>
      </Card>
    </div>
  );
}
