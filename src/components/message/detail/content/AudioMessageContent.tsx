
import React, { useState, useEffect } from "react";
import { FileIcon } from "lucide-react";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { Message } from "@/types/message";

interface AudioMessageContentProps {
  mediaUrl?: string | null;
  transcription?: string | null;
  loading?: boolean;
  message: Message;
}

export function AudioMessageContent({ mediaUrl, transcription, loading, message }: AudioMessageContentProps) {
  const [showTranscription, setShowTranscription] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(mediaUrl || null);
  const [audioTranscription, setAudioTranscription] = useState<string | null>(transcription || null);
  
  // Parse message content on component mount or when message changes
  useEffect(() => {
    console.log("AudioMessageContent: Processing message content");
    
    // Cleanup function to revoke object URL on unmount or message change
    let urlToRevoke: string | null = null;
    
    if (!audioUrl && message.content) {
      try {
        const contentObj = JSON.parse(message.content);
        console.log("AudioMessageContent: Parsed content:", contentObj);
        
        if (contentObj.audioData) {
          // Create a blob URL for playback
          const audioBlob = base64ToBlob(contentObj.audioData, 'audio/webm');
          console.log("AudioMessageContent: Created blob:", audioBlob.size);
          
          const url = URL.createObjectURL(audioBlob);
          console.log("AudioMessageContent: Created URL:", url);
          urlToRevoke = url;
          
          setAudioUrl(url);
          
          // Get transcription if available
          if (contentObj.transcription && !audioTranscription) {
            console.log("AudioMessageContent: Found transcription:", contentObj.transcription);
            setAudioTranscription(contentObj.transcription);
          }
        }
      } catch (e) {
        console.error("Error parsing audio content:", e);
      }
    }
    
    // Cleanup effect
    return () => {
      if (urlToRevoke) {
        console.log("AudioMessageContent: Revoking URL:", urlToRevoke);
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [message.content, audioUrl, audioTranscription, mediaUrl]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading voice message...</p>
      </div>
    );
  }

  if (!audioUrl) {
    return (
      <div className="text-center py-8 border rounded-md">
        <FileIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground">
          Voice message unavailable
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          The audio file might be missing or inaccessible
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AudioPlayer src={audioUrl} className="w-full" />
      
      {audioTranscription && (
        <div className="mt-4">
          <button 
            onClick={() => setShowTranscription(!showTranscription)}
            className="text-sm font-medium text-primary hover:underline transition-colors duration-200"
          >
            {showTranscription ? "Hide" : "Show"} Transcription
          </button>
          
          {showTranscription && (
            <div className="mt-2 p-3 border rounded-md bg-muted/30">
              <p className="italic text-sm">"{audioTranscription}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
  
  // Helper function to convert base64 to blob
  function base64ToBlob(base64: string, type: string): Blob {
    try {
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type });
    } catch (e) {
      console.error("Error converting base64 to blob:", e);
      return new Blob([], { type });
    }
  }
}
