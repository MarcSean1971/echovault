
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../../MessageFormContext";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function TextContent() {
  const { content, setContent } = useMessageForm();

  return (
    <>
      <Label htmlFor="content">Message Content</Label>
      <textarea
        id="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={`w-full p-2 border rounded-md min-h-[150px] ${HOVER_TRANSITION} focus:ring-2 focus:ring-primary/20 focus:border-primary`}
        placeholder="Enter your message content"
      />
    </>
  );
}
