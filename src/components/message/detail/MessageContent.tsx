
import { Message } from "@/types/message";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import { MessageTypeIcon } from "./MessageTypeIcon";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { FileIcon, FileText } from "lucide-react";
import { Card, CardDescription } from "@/components/ui/card";

interface MessageContentProps {
  message: Message;
  isArmed: boolean;
}

export function MessageContent({ message, isArmed }: MessageContentProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [showTranscription, setShowTranscription] = useState(false);
  
  // For audio and video messages, try to get the media file URL
  useEffect(() => {
    const getMediaFile = async () => {
      if (message.message_type !== 'text' && message.attachments && message.attachments.length > 0) {
        setLoading(true);
        
        try {
          const mainAttachment = message.attachments[0];
          
          // Try both message-attachments and message_attachments buckets
          let mediaData;
          try {
            mediaData = await supabase.storage
              .from('message-attachments')
              .createSignedUrl(mainAttachment.path, 3600);
          } catch (error) {
            console.error("Error with message-attachments bucket:", error);
            
            // Try with underscore
            mediaData = await supabase.storage
              .from('message_attachments')
              .createSignedUrl(mainAttachment.path, 3600);
          }
          
          if (mediaData.error) {
            throw mediaData.error;
          }

          setMediaUrl(mediaData.data.signedUrl);
          
          // Get transcription from content if it exists
          if (message.content) {
            try {
              const contentObj = JSON.parse(message.content);
              if (contentObj.transcription) {
                setTranscription(contentObj.transcription);
              }
            } catch (e) {
              // Not JSON or no transcription, use content as is
              setTranscription(message.content);
            }
          }
        } catch (error) {
          console.error("Error getting media URL:", error);
          toast({
            title: "Media Error",
            description: "Could not load the media file. The storage bucket might not exist or the file is not accessible.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    getMediaFile();
  }, [message]);

  return (
    <TabsContent value="content" className="space-y-4 pt-2">
      {message.message_type === 'text' ? (
        <div className="whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base">
          {message.content || <span className="text-muted-foreground italic">No content</span>}
        </div>
      ) : message.message_type === 'voice' ? (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading voice message...</p>
            </div>
          ) : mediaUrl ? (
            <div className="space-y-4">
              <AudioPlayer src={mediaUrl} className="w-full" />
              
              {transcription && (
                <div className="mt-4">
                  <button 
                    onClick={() => setShowTranscription(!showTranscription)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {showTranscription ? "Hide" : "Show"} Transcription
                  </button>
                  
                  {showTranscription && (
                    <div className="mt-2 p-3 border rounded-md bg-muted/30">
                      <p className="italic text-sm">"{transcription}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md">
              <FileIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                Voice message unavailable
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                The audio file might be missing or inaccessible
              </p>
            </div>
          )}
        </div>
      ) : message.message_type === 'video' ? (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading video message...</p>
            </div>
          ) : mediaUrl ? (
            <div className="space-y-4">
              <VideoPlayer 
                src={mediaUrl} 
                className="w-full aspect-video" 
              />
              
              {transcription && (
                <div className="mt-4">
                  <button 
                    onClick={() => setShowTranscription(!showTranscription)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {showTranscription ? "Hide" : "Show"} Transcription
                  </button>
                  
                  {showTranscription && (
                    <div className="mt-2 p-3 border rounded-md bg-muted/30">
                      <p className="italic text-sm">"{transcription}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md">
              <FileIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                Video message unavailable
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                The video file might be missing or inaccessible
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md">
          <p className="text-muted-foreground mb-4">
            Unknown message type
          </p>
          <p className="text-sm">
            This message type is not supported yet
          </p>
        </div>
      )}
      
      {/* Removed the duplicate attachments section that was here previously */}
    </TabsContent>
  );
}
