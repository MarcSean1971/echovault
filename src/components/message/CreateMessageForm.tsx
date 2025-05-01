
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
import { FileUploader, FileAttachment } from "@/components/FileUploader";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

    if (files.length > 0) {
      setShowUploadDialog(true);
      simulateUploadProgress();
    }

    try {
      await createMessage(
        userId,
        title,
        messageType === "text" ? content : null,
        messageType,
        files
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
      setShowUploadDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  // This is just to simulate upload progress for UI feedback
  // In a real production app, you might get this from the upload API
  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  return (
    <>
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

            <div className="space-y-2">
              <Label>Attachments (Optional)</Label>
              <FileUploader
                files={files}
                onChange={setFiles}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (messageType === "text" && !content)}
            >
              {isLoading ? "Saving..." : "Save Message"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Upload Progress Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md" hideClose>
          <DialogHeader>
            <DialogTitle>Uploading Files</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Uploading {files.length} file{files.length > 1 ? 's' : ''}...
              </p>
            </div>
          </div>
          <DialogFooter>
            {uploadProgress === 100 && !isLoading && (
              <p className="text-sm text-green-500">Upload complete! Saving message...</p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
