
import { Message } from "@/types/message";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface MessageMetadataProps {
  message: Message;
  formatDate: (dateString: string) => string;
  renderRecipients: () => React.ReactNode;
}

export function MessageMetadata({ 
  message, 
  formatDate, 
  renderRecipients 
}: MessageMetadataProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  
  return (
    <div className="md:hidden border-t pt-3 mt-2">
      <button 
        onClick={() => setShowMetadata(!showMetadata)}
        className="text-sm flex items-center w-full justify-between text-muted-foreground"
      >
        <span>Message details</span>
        {showMetadata ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {showMetadata && (
        <div className="pt-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Created</p>
            <p className="text-sm">{formatDate(message.created_at)}</p>
          </div>
          
          {message.updated_at !== message.created_at && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Last updated</p>
              <p className="text-sm">{formatDate(message.updated_at)}</p>
            </div>
          )}
          
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Recipients</p>
            {renderRecipients()}
          </div>
        </div>
      )}
    </div>
  );
}
