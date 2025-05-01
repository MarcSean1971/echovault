
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, File, Video, Trash2, Edit, ArrowRight } from "lucide-react";

type Message = {
  id: string;
  title: string;
  content: string | null;
  message_type: string;
  created_at: string;
  updated_at: string;
};

export default function Messages() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageType, setMessageType] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    const fetchMessages = async () => {
      setIsLoading(true);
      
      try {
        let query = supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (messageType) {
          query = query.eq('message_type', messageType);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setMessages(data as Message[]);
      } catch (error: any) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load your messages",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
  }, [userId, messageType]);
  
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setMessages(messages.filter(message => message.id !== id));
      
      toast({
        title: "Message deleted",
        description: "Your message has been permanently deleted",
      });
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete the message",
        variant: "destructive"
      });
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
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
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Messages</h1>
        <Button onClick={() => navigate("/create-message")}>
          Create New Message
        </Button>
      </div>
      
      <div className="flex justify-end mb-6">
        <div className="w-full max-w-xs">
          <Select value={messageType || ''} onValueChange={(value) => setMessageType(value || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Messages</SelectItem>
              <SelectItem value="text">Text Notes</SelectItem>
              <SelectItem value="voice">Voice Messages</SelectItem>
              <SelectItem value="video">Video Messages</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <p>Loading your messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="mb-4 text-muted-foreground">You don't have any messages yet</p>
            <Button onClick={() => navigate("/create-message")}>Create Your First Message</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {messages.map((message) => (
            <Card key={message.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getMessageIcon(message.message_type)}
                    <CardTitle className="text-lg">{message.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="pt-2">
                  {formatDate(message.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {message.message_type === 'text' ? (
                  <p className="line-clamp-3">
                    {message.content || "No content"}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    {message.message_type === 'voice' ? 'Voice message' : 'Video message'}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
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
                    onClick={() => handleDelete(message.id)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/message/${message.id}`)}
                >
                  View <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
