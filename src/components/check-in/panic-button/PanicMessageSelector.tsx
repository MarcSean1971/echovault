
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { MessageCondition } from "@/types/message";
import { MessageList } from "./panic-selector/MessageList";
import { DialogActions } from "./panic-selector/DialogActions";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

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

// Add missing import
import { useState } from "react";
