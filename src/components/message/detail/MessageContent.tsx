
import { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { toast } from "@/components/ui/use-toast";
import { TextMessageContent } from "./content/TextMessageContent";
import { AudioMessageContent } from "./content/AudioMessageContent";
import { VideoMessageContent } from "./content/VideoMessageContent";
import { UnknownMessageContent } from "./content/UnknownMessageContent";
import { getMessageMedia, parseMessageTranscription } from "@/services/messages/mediaService";

interface MessageContentProps {
  message: Message;
  isArmed: boolean;
}

export function MessageContent({ message, isArmed }: MessageContentProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  
  // For audio and video messages, try to get the media file URL
  useEffect(() => {
    const loadMessageMedia = async () => {
      if (message.message_type !== 'text' && message.attachments && message.attachments.length > 0) {
        setLoading(true);
        
        try {
          const mainAttachment = message.attachments[0];
          const { url, error } = await getMessageMedia(mainAttachment);
          
          if (error) {
            toast({
              title: "Media Error",
              description: error,
              variant: "destructive",
            });
          }

          setMediaUrl(url);
          
          // Get transcription from content if it exists
          const parsedTranscription = parseMessageTranscription(message.content);
          setTranscription(parsedTranscription);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadMessageMedia();
  }, [message]);

  return (
    <div className="space-y-4 pt-2">
      {message.message_type === 'text' ? (
        <TextMessageContent content={message.content} />
      ) : message.message_type === 'audio' ? (
        <AudioMessageContent 
          mediaUrl={mediaUrl} 
          transcription={transcription} 
          loading={loading} 
        />
      ) : message.message_type === 'video' ? (
        <VideoMessageContent 
          mediaUrl={mediaUrl} 
          transcription={transcription} 
          loading={loading} 
        />
      ) : (
        <UnknownMessageContent />
      )}
    </div>
  );
}
