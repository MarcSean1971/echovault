
import { useState, useEffect } from "react";
import { Message, MessageCondition } from "@/types/message";
import { MessageTimer } from "../MessageTimer";
import { MessageTypeIcon } from "../detail/MessageTypeIcon";
import { MapPin, AlertCircle, Calendar, MessageSquare, Video, Clock } from "lucide-react";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { parseVideoContent } from "@/services/messages/mediaService";
import { useMessageAdditionalText } from "@/hooks/useMessageAdditionalText";
import { useMessageLastCheckIn } from "@/hooks/useMessageLastCheckIn";

interface MessageCardContentProps {
  message: Message;
  isArmed: boolean;
  deadline: Date | null;
  condition: MessageCondition | null;
  transcription: string | null;
  refreshTrigger: number;
  isPanicSending?: boolean;
  panicCountDown?: number;
  isDelivered?: boolean;
}

export function MessageCardContent({
  message,
  isArmed,
  deadline,
  condition,
  transcription,
  refreshTrigger,
  isPanicSending = false,
  panicCountDown = 0,
  isDelivered = false
}: MessageCardContentProps) {
  // Display location if available and enabled
  const hasLocation = message.share_location && 
                    message.location_latitude != null && 
                    message.location_longitude != null;
                    
  // Check for attachments
  const hasAttachments = message.attachments && message.attachments.length > 0;
  
  // Check if message contains video content
  const [hasVideo, setHasVideo] = useState(false);
  
  // Check if this is a deadman's switch message
  const isDeadmansSwitch = condition?.condition_type === 'no_check_in';
  
  // Get additional text for video messages
  const { additionalText } = useMessageAdditionalText(message);
  
  // Get last check-in time formatting
  const { formattedCheckIn, isDeadmansSwitch: isDMS } = useMessageLastCheckIn(condition);
  
  // Detect video content
  useEffect(() => {
    if (message.content) {
      try {
        const { videoData } = parseVideoContent(message.content);
        setHasVideo(!!videoData);
      } catch (e) {
        console.error("Error detecting video content:", e);
        setHasVideo(false);
      }
    }
  }, [message.content]);

  // Determine what content to display
  const getDisplayContent = () => {
    // For deadman's switch or text messages, show simple text content
    if (message.message_type === "text") {
      return message.content;
    }
    
    // For video messages with additional text, show that text
    if (hasVideo && additionalText) {
      return additionalText;
    }
    
    // For video messages without additional text, show "Video message"
    if (hasVideo) {
      return "Video message";
    }
    
    // Fallback to transcription if available
    if (transcription) {
      return transcription;
    }
    
    // Ultimate fallback
    return message.content || (
      <span className="italic">
        {message.message_type.charAt(0).toUpperCase() + message.message_type.slice(1)} message
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Show panic sending state with countdown if active */}
      {isPanicSending && (
        <div className="mb-3 flex items-center text-destructive font-semibold animate-pulse rounded-md bg-destructive/10 p-2">
          <AlertCircle className="h-5 w-5 mr-1.5" />
          <span className="text-lg">{panicCountDown > 0 ? `Sending in ${panicCountDown}...` : "SENDING..."}</span>
        </div>
      )}

      {/* Show content preview */}
      <div className="text-sm text-muted-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors duration-200">
        <div className="flex items-start">
          <MessageSquare className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0 text-muted-foreground group-hover:text-primary/70" />
          <span className="flex-grow">
            {getDisplayContent()}
          </span>
        </div>
      </div>
      
      {/* Show last check-in time for deadman's switch messages */}
      {isDMS && formattedCheckIn && (
        <div className="text-xs flex items-center mt-1 text-muted-foreground">
          <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <span>Last check-in: {formattedCheckIn}</span>
        </div>
      )}
      
      {/* Show metadata badges in a flex row */}
      <div className="flex flex-wrap gap-2 mt-3">
        {/* Date badge */}
        <div className="inline-flex items-center text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
          <Calendar className="h-3 w-3 mr-1" />
          <span className="truncate max-w-[150px]">
            {new Date(message.created_at).toLocaleDateString()}
          </span>
        </div>
        
        {/* Video content badge - show for all messages with video */}
        {hasVideo && (
          <div className="inline-flex items-center text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
            <Video className="h-3 w-3 mr-1" />
            <span>Video</span>
          </div>
        )}
        
        {/* Location badge */}
        {hasLocation && (
          <div className="inline-flex items-center text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="truncate max-w-[150px]">
              {message.location_name || "Location"}
            </span>
          </div>
        )}
        
        {/* Attachments badge */}
        {hasAttachments && (
          <div className="inline-flex items-center text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
            <MessageTypeIcon messageType="file" className="h-3 w-3 mr-1" />
            <span>{message.attachments.length} file{message.attachments.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
      
      {/* Show deadline timer if armed */}
      {isArmed && deadline && (
        <div className="mt-4">
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
