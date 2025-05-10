
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Message, MessageAttachment } from "@/types/message";
import { EditMessageForm } from "@/components/message/FormSections/EditMessageForm";
import { Spinner } from "@/components/ui/spinner";
import { getConditionByMessageId } from "@/services/messages/conditionService";

type DatabaseMessage = {
  id: string;
  title: string;
  content: string;
  message_type: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  share_location?: boolean;
  location_name?: string;
  location_latitude?: number;
  location_longitude?: number;
  attachments?: any;
};

/**
 * Convert database message to our app Message type
 */
function convertDatabaseMessageToMessage(dbMessage: DatabaseMessage): Message {
  // Process attachments to ensure they match MessageAttachment type
  let processedAttachments: MessageAttachment[] = [];
  
  if (dbMessage.attachments && Array.isArray(dbMessage.attachments)) {
    processedAttachments = dbMessage.attachments.map(attachment => ({
      id: attachment.id || "",
      message_id: attachment.message_id || dbMessage.id,
      file_name: attachment.file_name || attachment.name || "",
      file_size: attachment.file_size || attachment.size || 0,
      file_type: attachment.file_type || attachment.type || "",
      url: attachment.url || attachment.path || "",
      created_at: attachment.created_at || dbMessage.created_at,
      // Add optional properties if they exist
      path: attachment.path,
      name: attachment.name,
      size: attachment.size,
      type: attachment.type
    }));
  }
  
  // Convert to Message type using a fresh object with explicit typing
  const message: Message = {
    id: dbMessage.id,
    title: dbMessage.title,
    content: dbMessage.content || "",
    message_type: dbMessage.message_type as "text" | "audio" | "video",
    user_id: dbMessage.user_id,
    created_at: dbMessage.created_at,
    updated_at: dbMessage.updated_at,
    share_location: dbMessage.share_location || false,
    location_name: dbMessage.location_name,
    location_latitude: dbMessage.location_latitude,
    location_longitude: dbMessage.location_longitude,
    attachments: processedAttachments
  };
  
  return message;
}

export default function MessageEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArmed, setIsArmed] = useState(false);

  useEffect(() => {
    if (!userId || !id) return;
    
    const fetchMessage = async () => {
      setIsLoading(true);
      
      try {
        // First check if message is armed
        const condition = await getConditionByMessageId(id);
        if (condition && condition.active) {
          // Message is armed, redirect to message view
          setIsArmed(true);
          toast({
            title: "Cannot edit armed message",
            description: "Please disarm the message first before editing",
            variant: "destructive"
          });
          navigate(`/message/${id}`);
          return;
        }
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        // Convert database result to our Message type
        const convertedMessage = convertDatabaseMessageToMessage(data as DatabaseMessage);
        setMessage(convertedMessage);
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <Spinner size="lg" />
        <span className="ml-2">Loading message...</span>
      </div>
    );
  }

  if (!message || isArmed) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {isArmed ? "Cannot edit armed message" : "Message not found"}
          </h1>
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
        onClick={() => navigate(`/message/${id}`)}
        className="mb-6 hover:bg-muted/80 transition-colors duration-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Message
      </Button>
      
      <div className="max-w-3xl mx-auto">
        <EditMessageForm 
          message={message} 
          onCancel={() => navigate(`/message/${id}`)} 
        />
      </div>
    </div>
  );
}
