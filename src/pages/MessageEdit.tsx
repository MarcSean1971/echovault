
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

type Message = {
  id: string;
  title: string;
  content: string | null;
  message_type: string;
  created_at: string;
  updated_at: string;
};

export default function MessageEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
        
        const message = data as Message;
        setTitle(message.title);
        setContent(message.content || "");
        setMessageType(message.message_type);
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !id) return;
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          title,
          content,
        })
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Message updated",
        description: "Your message has been updated successfully",
      });
      
      navigate(`/message/${id}`);
    } catch (error: any) {
      console.error("Error updating message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update the message",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <p>Loading message...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/message/${id}`)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Message
      </Button>
      
      <Card className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Edit Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Message Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            {messageType === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="content">Message Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px]"
                  required
                />
              </div>
            )}
            
            {messageType !== 'text' && (
              <div className="p-6 text-center border rounded-md">
                <p className="text-muted-foreground">
                  Editing content for {messageType} messages is not available yet.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => navigate(`/message/${id}`)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
