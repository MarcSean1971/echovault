
import { useMemo } from "react";

interface ContentKeyManagerProps {
  videoUrl: string | null;
  videoBlob: Blob | null;
  audioUrl: string | null;
  audioBlob: Blob | null;
}

export function useContentKeys({
  videoUrl,
  videoBlob,
  audioUrl,
  audioBlob
}: ContentKeyManagerProps) {
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

  return {
    videoContentKey,
    audioContentKey
  };
}
