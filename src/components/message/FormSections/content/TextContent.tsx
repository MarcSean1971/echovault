
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../../MessageFormContext";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AIEnhancer } from "@/components/AIEnhancer";
import { useState, useEffect } from "react";
import { parseMessageTranscription } from "@/services/messages/mediaService";

export function TextContent() {
  const { content, setContent, messageType } = useMessageForm();
  const [displayContent, setDisplayContent] = useState(content);

  // Handle different message types for display
  useEffect(() => {
    if (messageType === "video" && content) {
      try {
        // Try to parse as JSON to extract transcription
        const transcription = parseMessageTranscription(content);
        if (transcription) {
          // If this is video content with a transcription, show only the transcription
          setDisplayContent(transcription);
          return;
        }
      } catch (e) {
        // Not JSON or invalid format, use content as-is
        console.log("Content is not in JSON format or there was an error:", e);
      }
    }
    
    // For all other cases, show the raw content
    setDisplayContent(content);
  }, [content, messageType]);

  // Handle content changes, but only when not in video mode
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setDisplayContent(newContent);
  };

  return (
    <>
      <Label htmlFor="content">Message Content</Label>
      <textarea
        id="content"
        value={displayContent}
        onChange={handleContentChange}
        className={`w-full p-2 border rounded-md min-h-[150px] ${HOVER_TRANSITION} focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50`}
        placeholder={messageType === "video" ? "Video transcription will appear here" : "Enter your message content"}
        readOnly={messageType === "video"} // Make readonly when in video mode
      />
      <div className="flex justify-end mt-2">
        <AIEnhancer content={displayContent} onChange={setContent} />
      </div>
    </>
  );
}
