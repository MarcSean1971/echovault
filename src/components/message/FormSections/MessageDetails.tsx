import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIEnhancer } from "@/components/AIEnhancer";
import { MessageTypeUnavailable } from "../MessageTypeUnavailable";
import { FileUploader } from "@/components/FileUploader";
import { useMessageForm } from "../MessageFormContext";
import { Button } from "@/components/ui/button";
import { Mic, Video, Trash, X } from "lucide-react";
import { AudioRecorderDialog } from "@/components/media/AudioRecorderDialog";
import { VideoRecorderDialog } from "@/components/media/VideoRecorderDialog";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { get } from "http";

export function MessageDetails() {
  const {
    title,
    setTitle,
    content,
    setContent,
    messageType,
    setMessageType,
    files,
    setFiles,
    isLoading
  } = useMessageForm();

  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Handle audio recording completion
  const handleAudioReady = async (blob: Blob, base64Data: string) => {
    setAudioBlob(blob);
    setAudioBase64(base64Data);
    
    // Create URL for audio preview
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    
    // Start transcription
    await transcribeAudio(base64Data);
  };
  
  // Handle video recording completion
  const handleVideoReady = async (blob: Blob, base64Data: string) => {
    setVideoBlob(blob);
    setVideoBase64(base64Data);
    
    // Create URL for video preview
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(blob);
    setVideoUrl(url);
    
    // Start transcription
    await transcribeVideo(base64Data);
  };
  
  // Clear audio recording
  const clearAudioRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioBase64(null);
    setAudioUrl(null);
    setContent("");
  };
  
  // Clear video recording
  const clearVideoRecording = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(null);
    setVideoBase64(null);
    setVideoUrl(null);
    setContent("");
  };
  
  // Transcribe audio using edge function
  const transcribeAudio = async (audioData: string) => {
    if (!audioData) return;
    
    try {
      setIsTranscribing(true);
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioData, audioType: 'audio/webm' }
      });
      
      if (error) throw error;
      
      if (data.success && data.text) {
        // Store transcription as JSON in content
        setContent(JSON.stringify({ transcription: data.text }));
        
        toast({
          title: "Transcription Complete",
          description: "Your voice message has been transcribed successfully."
        });
      } else {
        throw new Error("Transcription failed or returned empty");
      }
    } catch (err) {
      console.error("Error transcribing audio:", err);
      toast({
        title: "Transcription Failed",
        description: "Could not transcribe your voice message. You can still send it without transcription.",
        variant: "destructive"
      });
      
      // Set empty transcription
      setContent(JSON.stringify({ transcription: "" }));
    } finally {
      setIsTranscribing(false);
    }
  };
  
  // Transcribe video using edge function
  const transcribeVideo = async (videoData: string) => {
    if (!videoData) return;
    
    try {
      setIsTranscribing(true);
      
      const { data, error } = await supabase.functions.invoke('process-video', {
        body: { videoData, videoType: 'video/webm' }
      });
      
      if (error) throw error;
      
      if (data.success && data.text) {
        // Store transcription as JSON in content
        setContent(JSON.stringify({ transcription: data.text }));
        
        toast({
          title: "Transcription Complete",
          description: "Your video message has been transcribed successfully."
        });
      } else {
        throw new Error("Transcription failed or returned empty");
      }
    } catch (err) {
      console.error("Error transcribing video:", err);
      toast({
        title: "Transcription Failed",
        description: "Could not transcribe your video message. You can still send it without transcription.",
        variant: "destructive"
      });
      
      // Set empty transcription
      setContent(JSON.stringify({ transcription: "" }));
    } finally {
      setIsTranscribing(false);
    }
  };
  
  // Create a File from Blob to add to attachments when message is ready to send
  const prepareMediaFileForUpload = (messageType: string, blob: Blob | null) => {
    if (!blob) return;
    
    // Create a File from the Blob
    const fileName = messageType === 'voice' ? 
      `voice_message_${new Date().getTime()}.webm` : 
      `video_message_${new Date().getTime()}.webm`;
    
    const file = new File([blob], fileName, {
      type: messageType === 'voice' ? 'audio/webm' : 'video/webm',
      lastModified: Date.now()
    });
    
    // Add to files state (single array for all attachments)
    const newAttachment = {
      file,
      name: fileName,
      size: file.size,
      type: file.type
    };
    
    // Replace any existing media files but keep other attachments
    const otherAttachments = files.filter(f => 
      !(messageType === 'voice' && f.type?.startsWith('audio')) && 
      !(messageType === 'video' && f.type?.startsWith('video'))
    );
    
    setFiles([...otherAttachments, newAttachment]);
  };
  
  // When message type changes, clear any media specific content
  const handleMessageTypeChange = (value: string) => {
    if (value !== messageType) {
      // Clear previous type's content
      if (messageType === 'voice') {
        clearAudioRecording();
      } else if (messageType === 'video') {
        clearVideoRecording();
      } else if (messageType === 'text' && value !== 'text') {
        setContent("");
      }
      
      setMessageType(value);
    }
  };

  // Effect to prepare media file for upload when needed
  // This works better outside a useEffect because we need it on form submit, not on state change
  if (messageType === 'voice' && audioBlob && files.every(f => !f.type?.startsWith('audio'))) {
    prepareMediaFileForUpload('voice', audioBlob);
  }
  
  if (messageType === 'video' && videoBlob && files.every(f => !f.type?.startsWith('video'))) {
    prepareMediaFileForUpload('video', videoBlob);
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Message Title</Label>
        <Input
          id="title"
          placeholder="Enter a title for this message"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Message Type</Label>
        <Select
          value={messageType}
          onValueChange={handleMessageTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select message type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text Note</SelectItem>
            <SelectItem value="voice">Voice Message</SelectItem>
            <SelectItem value="video">Video Message</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {messageType === "text" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">Message Content</Label>
            <AIEnhancer content={content} onChange={setContent} />
          </div>
          <Textarea
            id="content"
            placeholder="Write your message here..."
            className="min-h-[200px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
      )}

      {messageType === "voice" && (
        <div className="space-y-2">
          <Label>Voice Message</Label>
          {audioUrl ? (
            <div className="border rounded-md p-4 space-y-4">
              <AudioPlayer src={audioUrl} />
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  {isTranscribing && (
                    <p className="text-sm text-muted-foreground">Transcribing audio...</p>
                  )}
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={clearAudioRecording}
                >
                  <Trash className="h-4 w-4 mr-2" /> Discard Recording
                </Button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed rounded-md flex flex-col items-center justify-center p-8 space-y-4">
              <Mic className="h-10 w-10 text-muted-foreground" />
              <p className="text-center text-muted-foreground">Record a voice message to include in this message</p>
              <Button onClick={() => setShowAudioRecorder(true)}>
                <Mic className="h-4 w-4 mr-2" /> Record Voice
              </Button>
            </div>
          )}
          
          <AudioRecorderDialog
            open={showAudioRecorder}
            onOpenChange={setShowAudioRecorder}
            onAudioReady={handleAudioReady}
          />
        </div>
      )}

      {messageType === "video" && (
        <div className="space-y-2">
          <Label>Video Message</Label>
          {videoUrl ? (
            <div className="border rounded-md p-4 space-y-4">
              <VideoPlayer src={videoUrl} className="w-full aspect-video" />
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  {isTranscribing && (
                    <p className="text-sm text-muted-foreground">Transcribing video...</p>
                  )}
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={clearVideoRecording}
                >
                  <Trash className="h-4 w-4 mr-2" /> Discard Recording
                </Button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed rounded-md flex flex-col items-center justify-center p-8 space-y-4">
              <Video className="h-10 w-10 text-muted-foreground" />
              <p className="text-center text-muted-foreground">Record a video message to include in this message</p>
              <Button onClick={() => setShowVideoRecorder(true)}>
                <Video className="h-4 w-4 mr-2" /> Record Video
              </Button>
            </div>
          )}
          
          <VideoRecorderDialog
            open={showVideoRecorder}
            onOpenChange={setShowVideoRecorder}
            onVideoReady={handleVideoReady}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Attachments (Optional)</Label>
        <FileUploader
          files={files}
          onChange={setFiles}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
