import { useState } from "react";
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../MessageFormContext";
import { FileUploader } from "@/components/FileUploader";

// Import our components
import { TitleInput } from "./TitleInput";
import { LocationSection } from "./LocationSection";
import { MediaStateManager } from "./MessageDetailsComponents/MediaStateManager";
import { MessageTypeTabSelector } from "./MessageTypeTabSelector";
import { MediaRecordersDialog } from "./MessageDetailsComponents/MediaRecordersDialog";
import { VideoSection } from "./MessageDetailsComponents/VideoSection";
import { useContentKeys } from "./MessageDetailsComponents/ContentKeyManager";
import { FileAttachmentsSection } from "./MessageDetailsComponents/FileAttachmentsSection";

// Import custom hooks
import { useMessageVideoHandler } from "@/hooks/useMessageVideoHandler";
import { useContentUpdater } from "@/hooks/useContentUpdater";
import { useAudioTranscription } from "@/hooks/message/useAudioTranscription";
import { useMediaHandlers } from "@/hooks/message/useMediaHandlers";
import { useRecordingWrappers } from "@/hooks/message/useRecordingWrappers";

// Make sure we still import AudioSection so its import doesn't get cleaned up
// We need this for type checking and it's used in MessageTypeTabSelector
import { AudioSection } from "./MessageDetailsComponents/AudioSection";

interface MessageDetailsProps {
  message?: any;  // Optional message prop for editing
}

export function MessageDetails({ message }: MessageDetailsProps) {
  const { files, setFiles } = useMessageForm();
  
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

  // Get audio content updater from the hook
  const { handleAudioContentUpdate, handleVideoContentUpdate } = useContentUpdater();
  
  // Use our custom hooks for specific functionality
  const { audioTranscription, setAudioTranscription, handleTranscribeAudio } = useAudioTranscription();
  const { showInlineRecording, setShowInlineRecording, handleClearVideoAndRecord } = useMediaHandlers(clearVideo, setShowVideoRecorder);
  const { handleStartVideoRecordingWrapper, handleStartAudioRecordingWrapper } = useRecordingWrappers(
    forceInitializeCamera, 
    startAudioRecording
  );
  
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
  
  // Handle audio transcription with our specific audio blob
  const handleTranscribeAudioWrapper = () => {
    handleTranscribeAudio(audioBlob, transcribeAudio);
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
          onStartVideoRecording={handleStartVideoRecordingWrapper} 
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
          onTranscribeAudio={handleTranscribeAudioWrapper}
          
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

      {/* REMOVED: AudioSection - now only showing in the TabSelector */}
      {/* The audio section is already rendered in the MessageTypeTabSelector */}
      {/* We don't need to render it twice */}

      {/* Location section */}
      <LocationSection />

      {/* File attachments */}
      <FileAttachmentsSection files={files} setFiles={setFiles} />

      {/* Media recorder dialogs - keeping this as a backup option */}
      <MediaRecordersDialog 
        showVideoRecorder={showVideoRecorder}
        setShowVideoRecorder={setShowVideoRecorder}
        onVideoContentUpdate={handleVideoContentUpdate}
        videoUrl={videoUrl}
        videoBlob={videoBlob}
        isVideoRecording={isVideoRecording}
        isVideoInitializing={isVideoInitializing}
        hasVideoPermission={hasVideoPermission}
        videoPreviewStream={videoPreviewStream}
        startRecording={handleStartVideoRecordingWrapper}
        stopRecording={stopVideoRecording}
        clearVideo={clearVideo}
      />
    </div>
  );
}
