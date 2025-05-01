import { supabase } from "@/integrations/supabase/client";
import { Message, MessageCondition, Recipient } from "@/types/message";
import { FileAttachment } from "@/components/FileUploader";
import { Database } from "@/integrations/supabase/types";
import { Json } from "@/integrations/supabase/types";

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

// New functions for message conditions

export async function createMessageCondition(
  messageId: string,
  conditionType: 'no_check_in' | 'regular_check_in',
  hoursThreshold: number,
  recipients: Recipient[]
): Promise<MessageCondition> {
  try {
    const { data, error } = await supabase
      .from('message_conditions')
      .insert({
        message_id: messageId,
        condition_type: conditionType,
        hours_threshold: hoursThreshold,
        recipients: recipients,
        active: true,
        last_checked: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    return data[0] as unknown as MessageCondition;
  } catch (error) {
    console.error("Error creating message condition:", error);
    throw error;
  }
}

export async function fetchMessageCondition(messageId: string): Promise<MessageCondition | null> {
  try {
    const { data, error } = await supabase
      .from('message_conditions')
      .select('*')
      .eq('message_id', messageId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      throw error;
    }

    if (!data) {
      return null;
    }

    return data as unknown as MessageCondition;
  } catch (error) {
    console.error("Error fetching message condition:", error);
    throw error;
  }
}

export async function updateMessageCondition(
  id: string,
  updates: Partial<Omit<MessageCondition, 'id' | 'created_at' | 'updated_at'>>
): Promise<MessageCondition> {
  try {
    const { data, error } = await supabase
      .from('message_conditions')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    return data[0] as unknown as MessageCondition;
  } catch (error) {
    console.error("Error updating message condition:", error);
    throw error;
  }
}

// Recipients service functions
export async function fetchRecipients(): Promise<Recipient[]> {
  try {
    const { data, error } = await supabase
      .from('recipients')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) throw error;
    
    return data as Recipient[];
  } catch (error) {
    console.error("Error fetching recipients:", error);
    throw error;
  }
}

export async function createRecipient(
  userId: string,
  name: string,
  email: string,
  phone?: string
): Promise<Recipient> {
  try {
    const { data, error } = await supabase
      .from('recipients')
      .insert({
        user_id: userId,
        name,
        email,
        phone
      })
      .select();

    if (error) throw error;
    
    return data[0] as Recipient;
  } catch (error) {
    console.error("Error creating recipient:", error);
    throw error;
  }
}

export async function deleteRecipient(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recipients')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error deleting recipient:", error);
    throw error;
  }
}
