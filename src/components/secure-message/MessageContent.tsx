
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { TextMessageContent } from "./content/TextMessageContent";
import { AudioMessageContent } from "./content/AudioMessageContent";
import { VideoMessageContent } from "./content/VideoMessageContent";
import { UnknownMessageContent } from "./content/UnknownMessageContent";
import { toast } from "@/components/ui/use-toast";

interface MessageContentProps {
  message: any;
  deliveryId?: string | null;
  recipientEmail?: string | null;
}

export function MessageContent({ message, deliveryId, recipientEmail }: MessageContentProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});
  
  // Parse content for audio and video messages
  useEffect(() => {
    if (message.message_type === "audio" || message.message_type === "video") {
      try {
        const contentData = JSON.parse(message.content);
        setTranscription(contentData.transcription || null);
        
        if (message.message_type === "audio") {
          setAudioUrl(contentData.audioUrl || contentData.audioData || null);
        } else if (message.message_type === "video") {
          setVideoUrl(contentData.videoUrl || contentData.videoData || null);
        }
      } catch (e) {
        console.error("Error parsing message content:", e);
      }
    }
  }, [message]);
  
  const renderMessageContent = () => {
    switch (message.message_type) {
      case "text":
        return <TextMessageContent content={message.content} />;
      case "audio":
        return <AudioMessageContent audioUrl={audioUrl} transcription={transcription} />;
      case "video":
        return <VideoMessageContent videoUrl={videoUrl} transcription={transcription} />;
      default:
        return <UnknownMessageContent />;
    }
  };
  
  const downloadAttachment = async (attachment: any, index: number) => {
    if (!message.id || !deliveryId) {
      toast({
        title: "Error",
        description: "Missing required information to download the attachment",
        variant: "destructive"
      });
      return;
    }
    
    // Set downloading state for this attachment
    setIsDownloading(prev => ({ ...prev, [index]: true }));
    
    try {
      // Use the edge function to download the attachment securely
      const projectId = "onwthrpgcnfydxzzmyot";
      const url = `https://${projectId}.supabase.co/functions/v1/access-message/download-attachment`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          deliveryId,
          recipientEmail,
          attachmentPath: attachment.path,
          attachmentName: attachment.name
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error downloading attachment: ${response.statusText}`);
      }
      
      // Create a download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      toast({
        title: "Download Complete",
        description: `${attachment.name} has been downloaded successfully.`
      });
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading this attachment. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(prev => ({ ...prev, [index]: false }));
    }
  };
  
  const renderLocation = () => {
    if (message.share_location && message.location_latitude && message.location_longitude) {
      return (
        <div className="mt-6 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-md">
          <h3 className="text-lg font-medium mb-2">📍 Location Shared</h3>
          <p className="mb-2">{message.location_name || "Unnamed location"}</p>
          <a 
            href={`https://maps.google.com/?q=${message.location_latitude},${message.location_longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline ${HOVER_TRANSITION}`}
          >
            View on Google Maps
          </a>
        </div>
      );
    }
    return null;
  };
  
  const renderAttachments = () => {
    if (message.attachments && message.attachments.length > 0) {
      return (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Attachments</h3>
          <ul className="space-y-2">
            {message.attachments.map((attachment: any, index: number) => (
              <li key={index} className="p-2 bg-muted rounded-md flex items-center justify-between">
                <span className="flex-1 truncate">{attachment.name}</span>
                <span className="ml-2 mr-2 text-muted-foreground text-sm">
                  {attachment.size ? `(${(attachment.size / 1024).toFixed(1)} KB)` : ''}
                </span>
                {deliveryId && recipientEmail && (
                  <Button
                    variant="outline" 
                    size="sm"
                    className={`${HOVER_TRANSITION} ml-2`}
                    onClick={() => downloadAttachment(attachment, index)}
                    disabled={isDownloading[index]}
                  >
                    {isDownloading[index] ? 'Downloading...' : 'Download'}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {(!deliveryId || !recipientEmail) && (
            <p className="mt-2 text-sm text-muted-foreground">
              For security reasons, attachments are only available to authorized recipients.
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-3xl mx-auto p-6 overflow-hidden">
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold mb-1">{message.title || 'Untitled Message'}</h1>
        </div>
        
        {renderMessageContent()}
        {renderLocation()}
        {renderAttachments()}
      </Card>
      
      {/* Removed the "Go Back" button as it doesn't make sense in the secure view context */}
    </div>
  );
}
