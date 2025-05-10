
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCondition } from "@/types/message";
import { AlertCircle, FileText, Video, Headphones } from "lucide-react";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { supabase } from "@/integrations/supabase/client";

interface PanicMessageSelectorProps {
  messages: MessageCondition[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (messageId: string) => void;
}

interface MessageDetails {
  id: string;
  title: string;
  content: string | null;
  attachments: any[] | null;
  recipientCount: number;
}

export function PanicMessageSelector({ 
  messages, 
  isOpen, 
  onClose, 
  onSelect 
}: PanicMessageSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messageDetails, setMessageDetails] = useState<Record<string, MessageDetails>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch message details when the component mounts or messages change
  useEffect(() => {
    const fetchMessageDetails = async () => {
      if (!messages.length) return;
      
      setIsLoading(true);
      const details: Record<string, MessageDetails> = {};
      
      // Get all message IDs
      const messageIds = messages.map(condition => condition.message_id);
      
      try {
        // Fetch message details from the database
        const { data, error } = await supabase
          .from("messages")
          .select("id, title, content, attachments")
          .in("id", messageIds);
        
        if (error) throw error;
        
        // Create a mapping of message ID to details
        if (data) {
          data.forEach(message => {
            const condition = messages.find(c => c.message_id === message.id);
            // Access recipients safely with optional chaining
            const recipientCount = condition?.recipients?.length || 0;
            
            // Ensure attachments is always treated as an array
            const attachments = Array.isArray(message.attachments) 
              ? message.attachments 
              : message.attachments ? [message.attachments] : [];
            
            details[message.id] = {
              id: message.id,
              title: message.title,
              content: message.content,
              attachments,
              recipientCount
            };
          });
        }
        
        setMessageDetails(details);
      } catch (error) {
        console.error("Error fetching message details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessageDetails();
  }, [messages]);

  const handleSelect = () => {
    if (selectedId) {
      onSelect(selectedId);
      onClose();
    }
  };

  // Get attachment info from message details
  const getAttachmentInfo = (messageId: string) => {
    const details = messageDetails[messageId];
    if (!details || !details.attachments || !details.attachments.length) return null;
    
    const attachments = details.attachments;
    const counts = {
      text: 0,
      video: 0,
      audio: 0,
      other: 0
    };
    
    attachments.forEach(attachment => {
      if (attachment.type?.includes('text')) counts.text++;
      else if (attachment.type?.includes('video')) counts.video++;
      else if (attachment.type?.includes('audio')) counts.audio++;
      else counts.other++;
    });
    
    return { counts, total: attachments.length };
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            Select Emergency Message
          </DialogTitle>
          <DialogDescription>
            Choose which emergency message to send immediately to all recipients.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto py-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-4">Loading message details...</div>
          ) : (
            messages.map((message) => {
              const details = messageDetails[message.message_id];
              const attachmentInfo = details ? getAttachmentInfo(message.message_id) : null;
              // Access recipients safely with optional chaining
              const recipientCount = message.recipients?.length || 0;
              
              return (
                <div 
                  key={message.message_id} 
                  className={`p-4 border rounded-md cursor-pointer transition-all ${
                    selectedId === message.message_id 
                      ? "border-red-500 bg-red-50" 
                      : "border-gray-200 hover:border-red-200"
                  }`}
                  onClick={() => setSelectedId(message.message_id)}
                >
                  <div className="font-medium">{details?.title || "Emergency Message"}</div>
                  {details?.content && (
                    <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {details.content}
                    </div>
                  )}
                  
                  {attachmentInfo && attachmentInfo.total > 0 && (
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      {attachmentInfo.counts.text > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {attachmentInfo.counts.text}
                        </span>
                      )}
                      {attachmentInfo.counts.video > 0 && (
                        <span className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          {attachmentInfo.counts.video}
                        </span>
                      )}
                      {attachmentInfo.counts.audio > 0 && (
                        <span className="flex items-center gap-1">
                          <Headphones className="h-3 w-3" />
                          {attachmentInfo.counts.audio}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-1">
                    Recipients: {recipientCount}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className={HOVER_TRANSITION}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleSelect} 
            disabled={!selectedId || isLoading}
            className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.destructive}`}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Trigger Emergency
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
