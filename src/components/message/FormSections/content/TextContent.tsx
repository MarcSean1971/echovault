
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../../MessageFormContext";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AIEnhancer } from "@/components/AIEnhancer";
import { useState, useEffect } from "react";

export function TextContent() {
  const { content, setContent, messageType } = useMessageForm();
  const [displayContent, setDisplayContent] = useState(content);

  // Update display content based on message type
  useEffect(() => {
    if (messageType === "video") {
      // For video messages, just show a placeholder or empty content
      setDisplayContent("");
    } else {
      // For all other types, show the actual content
      setDisplayContent(content);
    }
  }, [content, messageType]);

  // Handle content changes, but only when not in video mode
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (messageType !== "video") {
      setDisplayContent(newContent);
    }
  };

  return (
    <>
      <Label htmlFor="content">Message Content</Label>
      <textarea
        id="content"
        value={displayContent}
        onChange={handleContentChange}
        className={`w-full p-2 border rounded-md min-h-[150px] ${HOVER_TRANSITION} focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50`}
        placeholder={
          messageType === "video"
            ? "Text content is not used when in video message mode"
            : "Enter your message content"
        }
        readOnly={messageType === "video"} // Make readonly when in video mode
      />
      <div className="flex justify-end mt-2">
        <AIEnhancer content={displayContent} onChange={setContent} />
      </div>
    </>
  );
}
