
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AIEnhancer } from "@/components/AIEnhancer";

export default function CreateMessage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "You must be signed in to create a message",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Save message to Supabase
      const { error } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          title,
          content,
          message_type: messageType
        });

      if (error) throw error;
      
      toast({
        title: "Message created",
        description: "Your message has been saved securely"
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating message:", error);
      toast({
        title: "Error",
        description: error.message || "There was a problem creating your message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create New Message</h1>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Message Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Message Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for this message"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Message Type</Label>
              <Select
                value={messageType}
                onValueChange={setMessageType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Note</SelectItem>
                  <SelectItem value="voice">Voice Message</SelectItem>
                  <SelectItem value="video">Video Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {messageType === "text" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Message Content</Label>
                  <AIEnhancer content={content} onChange={setContent} />
                </div>
                <Textarea
                  id="content"
                  placeholder="Write your message here..."
                  className="min-h-[200px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
            )}

            {messageType === "voice" && (
              <div className="space-y-2 text-center p-6 border rounded-md">
                <p className="mb-4">Voice recording functionality coming soon!</p>
                <Button type="button" disabled>Record Voice Message</Button>
              </div>
            )}

            {messageType === "video" && (
              <div className="space-y-2 text-center p-6 border rounded-md">
                <p className="mb-4">Video recording functionality coming soon!</p>
                <Button type="button" disabled>Record Video Message</Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || (messageType === "text" && !content)}>
              {isLoading ? "Saving..." : "Save Message"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
