
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, MessageSquare, File, Video } from "lucide-react";

type Message = {
  id: string;
  title: string;
  content: string | null;
  message_type: string;
  created_at: string;
  updated_at: string;
};

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {getMessageTypeIcon()}
                <CardTitle className="text-2xl">{message.title}</CardTitle>
              </div>
              <CardDescription>
                Created: {formatDate(message.created_at)}
                {message.updated_at !== message.created_at && (
                  <> • Updated: {formatDate(message.updated_at)}</>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/message/${message.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
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
