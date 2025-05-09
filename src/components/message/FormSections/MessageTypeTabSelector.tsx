
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextContent } from "./content/TextContent";
import { VideoContent } from "./content/VideoContent";

interface MessageTypeTabSelectorProps {
  messageType: string;
  onTabChange: (value: string) => void;
  videoUrl: string | null;
  isRecording: boolean;
  isInitializing: boolean;
  hasPermission: boolean | null;
  previewStream: MediaStream | null;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onClearVideo: () => void;
  getVideoContentKey: () => string;
}

export function MessageTypeTabSelector({
  messageType,
  onTabChange,
  videoUrl,
  isRecording,
  isInitializing,
  hasPermission,
  previewStream,
  onStartRecording,
  onStopRecording,
  onClearVideo,
  getVideoContentKey
}: MessageTypeTabSelectorProps) {
  return (
    <Tabs 
      defaultValue="text" 
      value={messageType} 
      onValueChange={onTabChange}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2 mb-6">
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

      {/* Video content tab */}
      <TabsContent value="video" className="mt-0">
        <VideoContent
          key={getVideoContentKey()}
          videoUrl={videoUrl}
          isRecording={isRecording}
          isInitializing={isInitializing}
          hasPermission={hasPermission}
          previewStream={previewStream}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onClearVideo={onClearVideo}
        />
      </TabsContent>
    </Tabs>
  );
}
