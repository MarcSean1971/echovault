
import { Message, MessageCondition } from "@/types/message";
import { MessageTimer } from "../MessageTimer";
import { MessageTypeIcon } from "../detail/MessageTypeIcon";
import { MapPin } from "lucide-react";
import { ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface MessageCardContentProps {
  message: Message;
  isArmed: boolean;
  deadline: Date | null;
  condition: MessageCondition | null;
  transcription: string | null;
  refreshTrigger: number;
}

export function MessageCardContent({
  message,
  isArmed,
  deadline,
  condition,
  transcription,
  refreshTrigger
}: MessageCardContentProps) {
  // Display location if available and enabled
  const hasLocation = message.share_location && 
                    message.location_latitude != null && 
                    message.location_longitude != null;

  return (
    <div>
      {/* Show content preview */}
      <div className="mt-1 mb-3 text-sm text-muted-foreground line-clamp-2">
        {message.content || transcription || (
          <span className="italic">
            {message.message_type === "text" 
              ? "No content" 
              : `${message.message_type.charAt(0).toUpperCase() + message.message_type.slice(1)} message`}
          </span>
        )}
      </div>
      
      {/* Show location if available */}
      {hasLocation && (
        <div className="mt-3 flex items-center text-sm text-muted-foreground">
          <MapPin className={`h-4 w-4 mr-1 ${ICON_HOVER_EFFECTS.muted}`} />
          <span className="truncate">{message.location_name || "Location attached"}</span>
        </div>
      )}
      
      {/* Show attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div className="mt-3 flex items-center text-sm text-muted-foreground">
          <MessageTypeIcon messageType="file" className="h-4 w-4 mr-1" />
          <span>{message.attachments.length} attachment{message.attachments.length !== 1 ? 's' : ''}</span>
        </div>
      )}
      
      {/* Show deadline timer if armed - changed 'active' to 'isArmed' to match component props */}
      {isArmed && deadline && (
        <div className="mt-3">
          <MessageTimer 
            deadline={deadline} 
            isArmed={isArmed} 
            refreshTrigger={refreshTrigger}
          />
        </div>
      )}
    </div>
  );
}
