
import { useMemo } from 'react';
import { Message } from '@/types/message';

export function useMessageContentTypes(message: Message, conditionType?: string) {
  return useMemo(() => {
    let videoData = null;
    let transcription = null;
    let additionalText = null;
    
    // Check if there's video content
    const hasVideoContent = message.video_content !== null && 
                          message.video_content !== undefined && 
                          message.video_content !== '';
    
    // Check if there's text content
    const hasTextContent = (message.text_content !== null && 
                          message.text_content !== undefined &&
                          message.text_content !== '') ||
                         (message.content !== null && 
                          message.content !== undefined &&
                          message.content !== '');
    
    // Parse video data if available
    if (hasVideoContent && typeof message.video_content === 'string') {
      try {
        videoData = JSON.parse(message.video_content);
        
        // Extract transcription and additional text
        if (videoData) {
          transcription = videoData.transcription || null;
          additionalText = videoData.additionalText || null;
        }
      } catch (e) {
        console.error('Failed to parse video content:', e);
      }
    }
    
    // Determine if this is a deadman's switch message
    const isDeadmansSwitch = conditionType === 'no_check_in';
    
    // Detect if we're on the message detail page
    const isMessageDetailPage = window.location.pathname.includes('/message/') && 
                              !window.location.pathname.includes('/create-message') &&
                              !window.location.pathname.includes('/edit');
    
    return {
      videoData,
      transcription,
      additionalText,
      hasVideoContent,
      hasTextContent,
      isDeadmansSwitch,
      isMessageDetailPage
    };
  }, [message, conditionType]);
}
