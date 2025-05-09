
import { useState } from 'react';
import { useMessageForm } from '@/components/message/MessageFormContext';
import { toast } from '@/components/ui/use-toast';

export function useContentUpdater() {
  const { setContent } = useMessageForm();
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);
  
  // Handle updating video content (stub for removed functionality)
  const handleVideoContentUpdate = async () => {
    console.log("Video functionality has been removed");
    return {};
  };
  
  // Clear video content (stub for removed functionality)
  const handleClearVideo = () => {
    setContent("");
  };
  
  return {
    handleVideoContentUpdate,
    handleClearVideo,
    isTranscribingVideo
  };
}
