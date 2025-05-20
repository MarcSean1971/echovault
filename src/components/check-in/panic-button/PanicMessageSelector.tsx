
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { MessageCondition } from "@/types/message";
import { MessageList } from "./panic-selector/MessageList";
import { DialogActions } from "./panic-selector/DialogActions";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PanicMessageSelectorProps {
  messages: MessageCondition[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (messageId: string) => void;
}

export function PanicMessageSelector({ 
  messages, 
  isOpen, 
  onClose, 
  onSelect 
}: PanicMessageSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messageTitles, setMessageTitles] = useState<Record<string, string>>({});
  const [messageContents, setMessageContents] = useState<Record<string, string>>({});

  // Fetch message titles and content when dialog opens
  useEffect(() => {
    const fetchMessageDetails = async () => {
      if (!isOpen || messages.length === 0) return;
      
      const messageIds = messages.map(m => m.message_id);
      
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, title, text_content")
          .in("id", messageIds);
          
        if (error) {
          console.error("Error fetching message details:", error);
          return;
        }
        
        // Transform data into maps for quick lookup
        const titles: Record<string, string> = {};
        const contents: Record<string, string> = {};
        
        data.forEach(msg => {
          titles[msg.id] = msg.title || "Emergency Message";
          contents[msg.id] = msg.text_content || "";
        });
        
        setMessageTitles(titles);
        setMessageContents(contents);
      } catch (error) {
        console.error("Error in fetchMessageDetails:", error);
      }
    };
    
    fetchMessageDetails();
  }, [isOpen, messages]);

  const handleSelect = () => {
    if (selectedId) {
      // Directly call onSelect which will now handle both the selection and triggering
      console.log("PanicMessageSelector: Triggering emergency for message:", selectedId);
      onSelect(selectedId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`sm:max-w-md ${HOVER_TRANSITION}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            Select Emergency Message
          </DialogTitle>
          <DialogDescription>
            Choose which emergency message to send immediately to all recipients.
          </DialogDescription>
        </DialogHeader>
        
        <MessageList
          messages={messages}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          messageTitles={messageTitles}
          messageContents={messageContents}
        />
        
        <DialogActions
          onClose={onClose}
          onSelect={handleSelect}
          isDisabled={!selectedId}
        />
      </DialogContent>
    </Dialog>
  );
}
