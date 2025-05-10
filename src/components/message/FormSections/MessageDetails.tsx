
import { useMessageForm } from "../MessageFormContext";
import { TitleInput } from "./TitleInput";
import { LocationSection } from "./LocationSection";
import { TextContent } from "./content/TextContent";
import { FileAttachmentsSection } from "./MessageDetailsComponents/FileAttachmentsSection";
import { MessageTypeTabSelector } from "./MessageTypeTabSelector";
import { FileAttachment } from "@/types/message";

interface MessageDetailsProps {
  message?: any;  // Optional message prop for editing
}

export function MessageDetails({ message }: MessageDetailsProps) {
  const { files, setFiles } = useMessageForm();

  return (
    <div className="space-y-6">
      {/* Title field */}
      <TitleInput />

      {/* Message type selector as tabs */}
      <div>
        <MessageTypeTabSelector />
      </div>
      
      {/* Text content */}
      <TextContent />

      {/* Location section */}
      <LocationSection />

      {/* File attachments */}
      <FileAttachmentsSection 
        files={files} 
        setFiles={setFiles} 
      />
    </div>
  );
}
