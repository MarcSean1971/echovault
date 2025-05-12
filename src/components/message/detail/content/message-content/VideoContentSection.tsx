
import React from "react";
import { Message } from "@/types/message";
import { VideoMessageContent } from "../VideoMessageContent";
import { TextMessageContent } from "../TextMessageContent";

interface VideoContentSectionProps {
  message: Message;
  additionalText: string | null;
  transcription: string | null;
}

export function VideoContentSection({ 
  message, 
  additionalText, 
  transcription 
}: VideoContentSectionProps) {
  return (
    <>
      {/* First show video content */}
      <div className="mb-6">
        <VideoMessageContent message={message} />
      </div>
      
      {/* Then show transcription if available */}
      {transcription && (
        <div className="mt-6 mb-4">
          <h3 className="text-sm font-medium mb-2">Video Transcription</h3>
          <div className="p-3 bg-muted/40 rounded-md">
            <p className="whitespace-pre-wrap">{transcription}</p>
          </div>
        </div>
      )}
      
      {/* Show additional text if available */}
      {additionalText && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Additional Notes</h3>
          <TextMessageContent 
            message={{...message, content: additionalText}} 
            content={additionalText} 
          />
        </div>
      )}
    </>
  );
}
