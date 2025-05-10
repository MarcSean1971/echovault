
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../../MessageFormContext";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AIEnhancer } from "@/components/AIEnhancer";
import { useState, useEffect } from "react";

export function TextContent() {
  const { textContent, setTextContent, messageType, setContent } = useMessageForm();
  const [displayContent, setDisplayContent] = useState(textContent);

  // Update display content when text content changes
  useEffect(() => {
    setDisplayContent(textContent);
  }, [textContent]);

  // Handle content changes for text
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setTextContent(newContent);
    setDisplayContent(newContent);
    
    // Only update the main content if we're in text mode
    if (messageType === 'text') {
      setContent(newContent);
    }
  };

  // Safety check to prevent showing JSON data in text field
  useEffect(() => {
    if (textContent && textContent.trim().startsWith('{') && textContent.includes('"audioData"')) {
      console.warn("Detected audio JSON data in text field - clearing to prevent data leak");
      setTextContent('');
      setDisplayContent('');
    }
    
    if (textContent && textContent.trim().startsWith('{') && textContent.includes('"videoData"')) {
      console.warn("Detected video JSON data in text field - clearing to prevent data leak");
      setTextContent('');
      setDisplayContent('');
    }
  }, [textContent, setTextContent]);

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
          if (messageType === 'text') {
            setContent(enhancedContent);
          }
          setDisplayContent(enhancedContent);
        }} />
      </div>
    </>
  );
}
