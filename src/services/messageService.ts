import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/message";
import { FileAttachment } from "@/components/FileUploader";

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
    
    return data as Message[];
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
    
    return data?.[0] as Message;
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
}

// Helper function to upload files to Supabase storage
async function uploadAttachments(
  userId: string, 
  attachments: FileAttachment[]
): Promise<Array<{path: string, name: string, size: number, type: string}>> {
  const uploadPromises = attachments.map(async (attachment) => {
    const file = attachment.file;
    const filePath = `${userId}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('message_attachments')
      .upload(filePath, file);
      
    if (error) throw error;
    
    return {
      path: data.path,
      name: file.name,
      size: file.size,
      type: file.type
    };
  });
  
  // Upload all files in parallel
  return Promise.all(uploadPromises);
}

// Function to get a signed URL for a file
export async function getFileUrl(path: string): Promise<string> {
  const { data } = await supabase.storage
    .from('message_attachments')
    .createSignedUrl(path, 3600); // 1 hour expiry
    
  return data?.signedUrl || '';
}

// Function to delete an attachment from storage
export async function deleteAttachment(path: string): Promise<void> {
  await supabase.storage
    .from('message_attachments')
    .remove([path]);
}
