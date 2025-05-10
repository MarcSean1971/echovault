
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../MessageFormContext";
import { FileUploader } from "@/components/FileUploader";

// Import our components
import { TitleInput } from "./TitleInput";
import { LocationSection } from "./LocationSection";
import { MediaRecorders } from "./MessageDetailsComponents/MediaRecorders";
import { MessageTypeTabSelector } from "./MessageTypeTabSelector";
import { MediaStateManager } from "./MessageDetailsComponents/MediaStateManager";
import { VideoSection } from "./MessageDetailsComponents/VideoSection";
import { AudioSection } from "./MessageDetailsComponents/AudioSection";
import { useContentKeys } from "./MessageDetailsComponents/ContentKeyManager";

// Import custom hooks
import { useMessageVideoHandler } from "@/hooks/useMessageVideoHandler";
import { useContentUpdater } from "@/hooks/useContentUpdater";

interface MessageDetailsProps {
  message?: any;  // Optional message prop for editing
}

export function MessageDetails({ message }: MessageDetailsProps) {
  const { files, setFiles } = useMessageForm();
  const [showInlineRecording, setShowInlineRecording] = useState(false);
  const [audioTranscription, setAudioTranscription] = useState<string | null>(null);
  
  // Get audio content updater from the hook
  const { handleAudioContentUpdate, handleVideoContentUpdate } = useContentUpdater();
  
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
    
    // Audio handling
    onAudioTypeClick,
    audioUrl, audioBlob, audioDuration, 
    isAudioRecording, isAudioInitializing, hasAudioPermission,
    startAudioRecording, stopAudioRecording, clearAudio, forceInitializeMicrophone,
    transcribeAudio, isAudioInitializationAttempted,
    
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
  
  // Content key generation using our extracted hook
  const { videoContentKey, audioContentKey } = useContentKeys({
    videoUrl,
    videoBlob, 
    audioUrl,
    audioBlob
  });
  
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
  
  // Handle clearing video and showing record dialog
  const handleClearVideoAndRecord = () => {
    clearVideo();
    setShowInlineRecording(false);
    // Show the dialog after a slight delay to ensure state updates
    setTimeout(() => {
      setShowVideoRecorder(true);
    }, 50);
  };

  // Create a wrapper function that explicitly returns Promise<void>
  const handleStartRecordingWrapper = async (): Promise<void> => {
    try {
      // Use void operator to explicitly discard the return value
      void await forceInitializeCamera();
      // No return statement ensures Promise<void>
    } catch (error) {
      console.error("Error in handleStartRecordingWrapper:", error);
      // No re-throw to maintain Promise<void>
    }
  };

  // Create a wrapper function for audio recording that explicitly returns Promise<void>
  const handleStartAudioRecordingWrapper = async (): Promise<void> => {
    try {
      // Use void operator to explicitly discard the boolean return value
      void await startAudioRecording();
      // No return statement ensures Promise<void>
    } catch (error) {
      console.error("Error in handleStartAudioRecordingWrapper:", error);
      // No re-throw to maintain Promise<void>
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
          onStartVideoRecording={handleStartRecordingWrapper} 
          onStopVideoRecording={stopVideoRecording}
          onClearVideo={handleClearVideoAndRecord}
          
          // Audio props
          audioUrl={audioUrl}
          audioDuration={audioDuration}
          isAudioRecording={isAudioRecording}
          isAudioInitializing={isAudioInitializing}
          hasAudioPermission={hasAudioPermission}
          audioTranscription={audioTranscription}
          onStartAudioRecording={handleStartAudioRecordingWrapper}
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

      {/* Video Section (conditionally rendered) */}
      <VideoSection 
        messageType={messageType}
        videoUrl={videoUrl}
        videoBlob={videoBlob}
        isVideoRecording={isVideoRecording}
        isVideoInitializing={isVideoInitializing}
        hasVideoPermission={hasVideoPermission}
        videoPreviewStream={videoPreviewStream}
        startVideoRecording={startVideoRecording}
        stopVideoRecording={stopVideoRecording}
        clearVideo={clearVideo}
        handleVideoContentUpdate={handleVideoContentUpdate}
        showVideoRecorder={showVideoRecorder}
        setShowVideoRecorder={setShowVideoRecorder}
        handleClearVideoAndRecord={handleClearVideoAndRecord}
      />

      {/* Audio Section (conditionally rendered) */}
      <AudioSection 
        messageType={messageType}
        audioUrl={audioUrl}
        audioBlob={audioBlob}
        audioDuration={audioDuration}
        isAudioRecording={isAudioRecording}
        isAudioInitializing={isAudioInitializing}
        hasAudioPermission={hasAudioPermission}
        audioTranscription={audioTranscription}
        startAudioRecording={handleStartAudioRecordingWrapper}
        stopAudioRecording={stopAudioRecording}
        clearAudio={() => {
          clearAudio();
          setAudioTranscription(null);
        }}
        onTranscribeAudio={handleTranscribeAudio}
      />

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
        startRecording={handleStartRecordingWrapper}
        stopRecording={stopVideoRecording}
        clearVideo={clearVideo}
      />
    </div>
  );
}
