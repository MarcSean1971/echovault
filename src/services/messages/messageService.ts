
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/message";
import { FileAttachment } from "@/components/FileUploader";
import { uploadAttachments } from "./fileService";

export async function fetchMessages(messageType: string | null = null) {
  try {
    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (messageType) {
      query = query.eq('message_type', messageType);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform the JSON attachments to match our Message type
    return (data || []).map(msg => ({
      ...msg,
      attachments: msg.attachments as unknown as Array<{
        path: string;
        name: string;
        size: number;
        type: string;
      }> | null
    })) as Message[];
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

export async function deleteMessage(id: string) {
  try {
    const { error } = await supabase
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
  attachments: FileAttachment[] = []
) {
  try {
    // First, upload any attachments
    const uploadedAttachments = attachments.length > 0 
      ? await uploadAttachments(userId, attachments)
      : [];

    // Then create the message with attachment references
    const { data, error } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        title,
        content,
        message_type: messageType,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null
      })
      .select();

    if (error) throw error;
    
    return {
      ...data?.[0],
      attachments: data?.[0]?.attachments as unknown as Array<{
        path: string;
        name: string;
        size: number;
        type: string;
      }> | null
    } as Message;
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
}
