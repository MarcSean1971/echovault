
import { useCallback } from "react";
import { Message, MessageAttachment } from "@/types/message";
import { Json } from "@/types/supabase";

export function useSecurityConstraints() {
  // Convert database message to our app Message type with proper typing
  const convertDatabaseMessageToMessage = useCallback((data: any): Message => {
    // Process attachments to ensure they match MessageAttachment type
    let processedAttachments: MessageAttachment[] = [];
    
    if (data.attachments && Array.isArray(data.attachments)) {
      processedAttachments = data.attachments.map((attachment: any) => ({
        id: attachment.id || "",
        message_id: attachment.message_id || data.id,
        file_name: attachment.file_name || attachment.name || "",
        file_size: attachment.file_size || attachment.size || 0,
        file_type: attachment.file_type || attachment.type || "",
        url: attachment.url || attachment.path || "",
        created_at: attachment.created_at || data.created_at,
        // Add optional properties if they exist
        path: attachment.path,
        name: attachment.name,
        size: attachment.size,
        type: attachment.type
      }));
    }
    
    // Convert to Message type with type assertion
    const convertedMessage = {
      ...data,
      attachments: processedAttachments,
      message_type: data.message_type as "text" | "audio" | "video"
    } as Message;
    
    return convertedMessage;
  }, []);

  return { convertDatabaseMessageToMessage };
}
