
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextContent } from "./content/TextContent";
import { VideoContent } from "./content/VideoContent";
import { AudioContent } from "./content/AudioContent";

interface MessageTypeTabSelectorProps {
  messageType: string;
  onTabChange: (value: string) => void;
  
  // Video props
  videoUrl: string | null;
  isVideoRecording: boolean;
  isVideoInitializing: boolean;
  hasVideoPermission: boolean | null;
  videoPreviewStream: MediaStream | null;
  onStartVideoRecording: () => Promise<void>;
  onStopVideoRecording: () => void;
  onClearVideo: () => void;
  
  // Audio props
  audioUrl: string | null;
  audioDuration: number;
  isAudioRecording: boolean;
  isAudioInitializing: boolean;
  hasAudioPermission: boolean | null;
  audioTranscription?: string | null;
  onStartAudioRecording: () => Promise<void>;
  onStopAudioRecording: () => void;
  onClearAudio: () => void;
  onTranscribeAudio?: () => Promise<void>;
  
  getVideoContentKey: () => string;
  getAudioContentKey: () => string;
}

export function MessageTypeTabSelector({
  messageType,
  onTabChange,
  
  // Video props
  videoUrl,
  isVideoRecording,
  isVideoInitializing,
  hasVideoPermission,
  videoPreviewStream,
  onStartVideoRecording,
  onStopVideoRecording,
  onClearVideo,
  
  // Audio props
  audioUrl,
  audioDuration,
  isAudioRecording,
  isAudioInitializing,
  hasAudioPermission,
  audioTranscription,
  onStartAudioRecording,
  onStopAudioRecording,
  onClearAudio,
  onTranscribeAudio,
  
  getVideoContentKey,
  getAudioContentKey
}: MessageTypeTabSelectorProps) {
  return (
    <Tabs 
      defaultValue="text" 
      value={messageType} 
      onValueChange={onTabChange}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger 
          value="text" 
          className="flex items-center justify-center transition-all hover:bg-primary/10"
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-text">
              <path d="M17 6.1H3"/>
              <path d="M21 12.1H3"/>
              <path d="M15.1 18H3"/>
            </svg>
            Text
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="audio" 
          className="flex items-center justify-center transition-all hover:bg-primary/10"
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <path d="M12 19v3"/>
              <path d="M8 22h8"/>
            </svg>
            Audio
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="video" 
          className="flex items-center justify-center transition-all hover:bg-primary/10"
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video">
              <path d="m22 8-6 4 6 4V8Z"/>
              <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
            </svg>
            Video
          </span>
        </TabsTrigger>
      </TabsList>

      {/* Text content tab */}
      <TabsContent value="text" className="mt-0">
        <TextContent />
      </TabsContent>
      
      {/* Audio content tab */}
      <TabsContent value="audio" className="mt-0">
        <AudioContent
          key={getAudioContentKey()}
          audioUrl={audioUrl}
          audioDuration={audioDuration}
          isRecording={isAudioRecording}
          isInitializing={isAudioInitializing}
          hasPermission={hasAudioPermission}
          transcription={audioTranscription}
          onStartRecording={onStartAudioRecording}
          onStopRecording={onStopAudioRecording}
          onClearAudio={onClearAudio}
          onTranscribeAudio={onTranscribeAudio}
        />
      </TabsContent>

      {/* Video content tab */}
      <TabsContent value="video" className="mt-0">
        <VideoContent
          key={getVideoContentKey()}
          videoUrl={videoUrl}
          isRecording={isVideoRecording}
          isInitializing={isVideoInitializing}
          hasPermission={hasVideoPermission}
          previewStream={videoPreviewStream}
          onStartRecording={onStartVideoRecording}
          onStopRecording={onStopVideoRecording}
          onClearVideo={onClearVideo}
        />
      </TabsContent>
    </Tabs>
  );
}
