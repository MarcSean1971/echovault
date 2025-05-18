import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Message } from "@/types/message";
import { EditMessageForm } from "@/components/message/FormSections/EditMessageForm";
import { Spinner } from "@/components/ui/spinner";
import { getConditionByMessageId } from "@/services/messages/conditionService";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

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
        
        setMessage(data as unknown as Message);
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
        className={`mb-6 hover:bg-muted/80 hover:text-foreground ${HOVER_TRANSITION}`}
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
