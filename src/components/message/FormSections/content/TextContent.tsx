
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../../MessageFormContext";

export function TextContent() {
  const { content, setContent } = useMessageForm();

  return (
    <>
      <Label htmlFor="content">Message Content</Label>
      <textarea
        id="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 border rounded-md min-h-[150px]"
        placeholder="Enter your message content"
      />
    </>
  );
}
