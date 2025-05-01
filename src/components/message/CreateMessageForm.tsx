
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AIEnhancer } from "@/components/AIEnhancer";
import { MessageTypeUnavailable } from "./MessageTypeUnavailable";
import { createMessage } from "@/services/messageService";

interface CreateMessageFormProps {
  onCancel: () => void;
}

export function CreateMessageForm({ onCancel }: CreateMessageFormProps) {
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
      await createMessage(
        userId,
        title,
        messageType === "text" ? content : null,
        messageType
      );
      
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
            <MessageTypeUnavailable type="Voice recording" />
          )}

          {messageType === "video" && (
            <MessageTypeUnavailable type="Video recording" />
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || (messageType === "text" && !content)}>
            {isLoading ? "Saving..." : "Save Message"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
