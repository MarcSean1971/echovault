
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../../MessageFormContext";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AIEnhancer } from "@/components/AIEnhancer";
import { useState, useEffect } from "react";

export function TextContent() {
  const { textContent, setTextContent, messageType, setContent, videoContent } = useMessageForm();
  const [displayContent, setDisplayContent] = useState(textContent || "");

  // Update display content when text content changes
  useEffect(() => {
    setDisplayContent(textContent || "");
  }, [textContent]);

  // Handle content changes for text
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setTextContent(newContent);
    setDisplayContent(newContent);
    
    // Also update the main content field for compatibility with other components
    // Don't overwrite video content when editing text
    if (messageType === "text") {
      setContent(newContent);
    }
    // When in video tab, we'll handle the combined content in handleVideoContentUpdate
    // and in the submit handler, so we don't need to update content here
  };

  return (
    <>
      <Label htmlFor="content">Message Content</Label>
      <textarea
        id="content"
        value={displayContent}
        onChange={handleContentChange}
        className={`w-full p-2 border rounded-md min-h-[150px] ${HOVER_TRANSITION} focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50`}
        placeholder="Enter your message content"
      />
      <div className="flex justify-end mt-2">
        <AIEnhancer content={displayContent} onChange={(enhancedContent) => {
          setTextContent(enhancedContent);
          // Only update main content if we're in text mode
          if (messageType === "text") {
            setContent(enhancedContent);
          }
          setDisplayContent(enhancedContent);
        }} />
      </div>
    </>
  );
}
