
import { getAuthClient } from "@/lib/supabaseClient";
import { Message } from "@/types/message";
import { FileAttachment } from "@/components/FileUploader";
import { uploadAttachments } from "./fileService";

export async function fetchMessages(messageType: string | null = null) {
  try {
    const client = await getAuthClient();
    
    console.log("Fetching messages", messageType ? `with type: ${messageType}` : "all types");
    
    let query = client
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (messageType) {
      query = query.eq('message_type', messageType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error in fetchMessages:", error);
      throw error;
    }
    
    console.log(`Successfully retrieved ${data?.length || 0} messages`);
    
    // Transform the database response to match our Message type
    return (data || []).map(msg => ({
      ...msg,
      // Type-safe transformations for fields that might not exist in the database
      attachments: msg.attachments as unknown as Array<{
        path: string;
        name: string;
        size: number;
        type: string;
      }> | null,
      // Add default values for fields required by Message type but missing in DB
      expires_at: null, // These fields don't exist in the DB schema
      sender_name: null,
      // Ensure panic_trigger_config and other optional fields are present
      panic_trigger_config: msg.panic_trigger_config || null,
      panic_config: msg.panic_config || null
    })) as Message[];
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

export async function deleteMessage(id: string) {
  try {
    const client = await getAuthClient();
    
    const { error } = await client
      .from('messages')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
}

export async function createMessage(
  userId: string, 
  title: string, 
  content: string | null, 
  messageType: string,
  attachments: FileAttachment[] = [],
  locationData: {
    latitude: number | null;
    longitude: number | null;
    name: string | null;
    shareLocation: boolean;
  } | null = null
) {
  try {
    // First, upload any attachments
    const uploadedAttachments = attachments.length > 0 
      ? await uploadAttachments(userId, attachments)
      : [];

    // Determine which content field to use based on type
    let textContent = null;
    let videoContent = null;
    
    if (messageType === 'text') {
      textContent = content;
    } else if (messageType === 'video') {
      videoContent = content;
      
      // Check if the video content has additionalText we should extract
      try {
        const contentObj = JSON.parse(content || '{}');
        if (contentObj.additionalText) {
          textContent = contentObj.additionalText;
        }
      } catch (e) {
        // Not JSON or no additionalText field
      }
    } else {
      // For other types, preserve the content in the legacy field
      // but also try to determine if it's text or video
      if (content && content.includes('videoData')) {
        videoContent = content;
      } else {
        textContent = content;
      }
    }

    // Then create the message with attachment references, location data, and separated content fields
    const client = await getAuthClient();
    
    const messageData: any = {
      user_id: userId,
      title,
      content,  // Keep legacy content for backward compatibility
      text_content: textContent,
      video_content: videoContent,
      message_type: messageType,
      attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null
    };
    
    // Add location data if provided
    if (locationData && locationData.shareLocation) {
      messageData.location_latitude = locationData.latitude;
      messageData.location_longitude = locationData.longitude;
      messageData.location_name = locationData.name;
      messageData.share_location = locationData.shareLocation;
    }
    
    const { data, error } = await client
      .from('messages')
      .insert(messageData)
      .select();

    if (error) throw error;
    
    // Add missing fields required by Message type but not in DB schema
    return {
      ...data?.[0],
      attachments: data?.[0]?.attachments as unknown as Array<{
        path: string;
        name: string;
        size: number;
        type: string;
      }> | null,
      // Set default values for fields required by Message type
      expires_at: null, // These fields don't exist in the DB schema
      sender_name: null,
      panic_trigger_config: null,
      panic_config: null
    } as Message;
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
}
