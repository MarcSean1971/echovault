
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
    
    // Convert to Message type with explicit type casting
    const convertedMessage: Message = {
      id: data.id,
      title: data.title,
      content: data.content || "",
      message_type: data.message_type as "text" | "audio" | "video",
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      expires_at: data.expires_at,
      expires_in_hours: data.expires_in_hours,
      is_armed: data.is_armed,
      sender_name: data.sender_name,
      share_location: data.share_location,
      location_name: data.location_name,
      latitude: data.latitude,
      longitude: data.longitude,
      location_latitude: data.location_latitude,
      location_longitude: data.location_longitude,
      attachments: processedAttachments
    };
    
    return convertedMessage;
  }, []);

  return { convertDatabaseMessageToMessage };
}
