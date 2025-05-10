
import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../MessageFormContext";
import { FileUploader } from "@/components/FileUploader";

// Import our components
import { TitleInput } from "./TitleInput";
import { LocationSection } from "./LocationSection";
import { MediaRecorders } from "./MessageDetailsComponents/MediaRecorders";
import { MessageTypeTabSelector } from "./MessageTypeTabSelector";
import { MediaStateManager } from "./MessageDetailsComponents/MediaStateManager";

// Import custom hooks
import { useMessageVideoHandler } from "@/hooks/useMessageVideoHandler";

// Import Button from UI components for Record Video button
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

interface MessageDetailsProps {
  message?: any;  // Optional message prop for editing
}

export function MessageDetails({ message }: MessageDetailsProps) {
  const { files, setFiles } = useMessageForm();
  const [showInlineRecording, setShowInlineRecording] = useState(false);
  const [audioTranscription, setAudioTranscription] = useState<string | null>(null);
  
  // Use our custom hook for handling media
  const {
    // Text handling
    onTextTypeClick,
    messageType,
    
    // Video handling
    onVideoTypeClick,
    videoUrl, videoBlob, showVideoRecorder, setShowVideoRecorder,
    isVideoRecording, isVideoInitializing, hasVideoPermission, videoPreviewStream,
    startVideoRecording, stopVideoRecording, clearVideo, forceInitializeCamera, 
    handleVideoContentUpdate,
    
    // Audio handling
    onAudioTypeClick,
    audioUrl, audioBlob, audioDuration, 
    isAudioRecording, isAudioInitializing, hasAudioPermission,
    startAudioRecording, stopAudioRecording, clearAudio, forceInitializeMicrophone,
    transcribeAudio, isAudioInitializationAttempted,
    handleAudioContentUpdate,
    
    // Initialization state
    initializedFromMessage
  } = useMessageVideoHandler(message);

  // Handle tab change
  const handleTabChange = (value: string) => {
    console.log("Tab changed to:", value);
    if (value === "text") {
      onTextTypeClick();
    } else if (value === "video") {
      onVideoTypeClick();
    } else if (value === "audio") {
      onAudioTypeClick();
    }
  };
  
  // Create a wrapper function for forceInitializeCamera that returns void
  const handleStartRecordingWrapper = async (): Promise<void> => {
    // Call the original function but completely ignore its boolean result
    // Using void operator to explicitly ensure void return type
    void await forceInitializeCamera();
    
    // Explicitly return undefined to satisfy Promise<void>
    return undefined;
  };

  // Generate stable content keys to avoid unnecessary remounts
  const videoContentKey = useMemo(() => {
    const hasContent = Boolean(videoUrl || videoBlob);
    return `video-content-${hasContent ? 'has-video' : 'no-video'}`;
  }, [videoUrl, videoBlob]);
  
  // Add back the audioContentKey that was missing
  const audioContentKey = useMemo(() => {
    const hasContent = Boolean(audioUrl || audioBlob);
    return `audio-content-${hasContent ? 'has-audio' : 'no-audio'}`;
  }, [audioUrl, audioBlob]);
  
  // Handle audio transcription
  const handleTranscribeAudio = async () => {
    if (!audioBlob) return;
    
    try {
      const transcription = await transcribeAudio();
      setAudioTranscription(transcription);
      
      // Update the audio content with transcription
      if (audioBlob) {
        await handleAudioContentUpdate(audioBlob, transcription);
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Media state manager - handles initialization of camera/microphone */}
      <MediaStateManager 
        messageType={messageType}
        videoUrl={videoUrl}
        videoPreviewStream={videoPreviewStream}
        audioUrl={audioUrl}
        showInlineRecording={showInlineRecording}
        setShowInlineRecording={setShowInlineRecording}
        forceInitializeCamera={forceInitializeCamera}
        forceInitializeMicrophone={forceInitializeMicrophone}
        isAudioInitializationAttempted={isAudioInitializationAttempted}
        initializedFromMessage={initializedFromMessage}
      />

      {/* Title field */}
      <TitleInput />

      {/* Message type selector as tabs */}
      <div>
        <Label className="mb-2 block">Message Type</Label>
        <MessageTypeTabSelector
          messageType={messageType}
          onTabChange={handleTabChange}
          
          // Video props
          videoUrl={videoUrl}
          isVideoRecording={isVideoRecording}
          isVideoInitializing={isVideoInitializing}
          hasVideoPermission={hasVideoPermission}
          videoPreviewStream={videoPreviewStream}
          onStartVideoRecording={startVideoRecording}
          onStopVideoRecording={stopVideoRecording}
          onClearVideo={() => {
            clearVideo();
            setShowInlineRecording(false);
          }}
          
          // Audio props
          audioUrl={audioUrl}
          audioDuration={audioDuration}
          isAudioRecording={isAudioRecording}
          isAudioInitializing={isAudioInitializing}
          hasAudioPermission={hasAudioPermission}
          audioTranscription={audioTranscription}
          onStartAudioRecording={startAudioRecording}
          onStopAudioRecording={stopAudioRecording}
          onClearAudio={() => {
            clearAudio();
            setAudioTranscription(null);
            setShowInlineRecording(false);
          }}
          onTranscribeAudio={handleTranscribeAudio}
          
          // Keys for component remounting
          getVideoContentKey={() => videoContentKey}
          getAudioContentKey={() => audioContentKey}
        />
      </div>

      {/* Location section */}
      <LocationSection />

      {/* File attachments */}
      <div className="space-y-2">
        <Label>File Attachments</Label>
        <FileUploader 
          files={files} 
          onChange={setFiles} 
        />
      </div>

      {/* Media recorder dialogs - keeping this as a backup option */}
      <MediaRecorders 
        showVideoRecorder={showVideoRecorder}
        setShowVideoRecorder={setShowVideoRecorder}
        onVideoContentUpdate={handleVideoContentUpdate}
        videoUrl={videoUrl}
        videoBlob={videoBlob}
        isRecording={isVideoRecording}
        isInitializing={isVideoInitializing}
        hasPermission={hasVideoPermission}
        previewStream={videoPreviewStream}
        startRecording={handleStartRecordingWrapper} // Use the wrapper function that returns void
        stopRecording={stopVideoRecording}
        clearVideo={clearVideo}
      />
    </div>
  );
}
