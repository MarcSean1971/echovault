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
import { createMessage, createMessageCondition, fetchRecipients } from "@/services/messageService";
import { FileUploader, FileAttachment } from "@/components/FileUploader";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { Recipient } from "@/types/message";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus } from "lucide-react";

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
  
  // Dead man's switch related states
  const [enableDeadManSwitch, setEnableDeadManSwitch] = useState(false);
  const [conditionType, setConditionType] = useState<'no_check_in' | 'regular_check_in'>('no_check_in');
  const [hoursThreshold, setHoursThreshold] = useState(72); // Default 72 hours (3 days)
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [showRecipientsSheet, setShowRecipientsSheet] = useState(false);
  
  // Fetch recipients on component mount
  useEffect(() => {
    if (userId) {
      const loadRecipients = async () => {
        try {
          const data = await fetchRecipients();
          setRecipients(data);
        } catch (error) {
          console.error("Error fetching recipients:", error);
        }
      };
      
      loadRecipients();
    }
  }, [userId]);

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
      // First, create the message
      const newMessage = await createMessage(
        userId,
        title,
        messageType === "text" ? content : null,
        messageType,
        files
      );
      
      // If dead man's switch is enabled, create the message condition
      if (enableDeadManSwitch && selectedRecipients.length > 0) {
        const selectedRecipientObjects = recipients.filter(
          recipient => selectedRecipients.includes(recipient.id)
        );
        
        await createMessageCondition(
          newMessage.id,
          conditionType,
          hoursThreshold,
          selectedRecipientObjects
        );
      }
      
      toast({
        title: "Message created",
        description: enableDeadManSwitch 
          ? "Your message has been saved with dead man's switch enabled" 
          : "Your message has been saved securely"
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

  const toggleRecipientSelection = (recipientId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
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

            {/* Dead Man's Switch Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Dead Man's Switch</h3>
                  <p className="text-sm text-muted-foreground">
                    Release this message to trusted recipients if you don't check in
                  </p>
                </div>
                <Switch
                  checked={enableDeadManSwitch}
                  onCheckedChange={setEnableDeadManSwitch}
                  id="dead-man-switch"
                />
              </div>

              {enableDeadManSwitch && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="condition-type">Release Condition</Label>
                    <Select
                      value={conditionType}
                      onValueChange={(value: 'no_check_in' | 'regular_check_in') => setConditionType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_check_in">If I don't check in</SelectItem>
                        <SelectItem value="regular_check_in">If I miss a regular check-in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours-threshold">Time Threshold (hours)</Label>
                    <Input
                      id="hours-threshold"
                      type="number"
                      min={1}
                      max={8760} // 1 year in hours
                      value={hoursThreshold}
                      onChange={(e) => setHoursThreshold(Number(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      {conditionType === 'no_check_in' 
                        ? "Message will be released if you don't check in within this time period"
                        : "Message will be released if you miss your regular check-in by this amount of time"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Select Recipients</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/recipients')}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Recipient
                      </Button>
                    </div>
                    
                    <Sheet open={showRecipientsSheet} onOpenChange={setShowRecipientsSheet}>
                      <SheetTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full justify-between"
                        >
                          {selectedRecipients.length 
                            ? `${selectedRecipients.length} recipient(s) selected` 
                            : "Select recipients"}
                          <span className="sr-only">Select recipients</span>
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Select Recipients</SheetTitle>
                          <SheetDescription>
                            Choose who should receive this message if the dead man's switch is triggered
                          </SheetDescription>
                        </SheetHeader>
                        
                        <div className="my-6 space-y-4">
                          {recipients.length === 0 ? (
                            <div className="text-center py-4">
                              <p className="text-muted-foreground">No recipients added yet.</p>
                              <Button 
                                type="button" 
                                variant="outline" 
                                className="mt-2"
                                onClick={() => {
                                  setShowRecipientsSheet(false);
                                  navigate('/recipients');
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add Recipient
                              </Button>
                            </div>
                          ) : (
                            recipients.map(recipient => (
                              <div key={recipient.id} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`recipient-${recipient.id}`} 
                                  checked={selectedRecipients.includes(recipient.id)}
                                  onCheckedChange={() => toggleRecipientSelection(recipient.id)}
                                />
                                <Label 
                                  htmlFor={`recipient-${recipient.id}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="font-medium">{recipient.name}</div>
                                  <div className="text-sm text-muted-foreground">{recipient.email}</div>
                                </Label>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <SheetFooter>
                          <Button 
                            type="button" 
                            onClick={() => setShowRecipientsSheet(false)}
                          >
                            Done
                          </Button>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>
                    
                    {enableDeadManSwitch && selectedRecipients.length === 0 && (
                      <p className="text-sm text-red-500">
                        You must select at least one recipient
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                isLoading || 
                (messageType === "text" && !content) ||
                (enableDeadManSwitch && selectedRecipients.length === 0)
              }
            >
              {isLoading ? "Saving..." : "Save Message"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Upload Progress Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
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
