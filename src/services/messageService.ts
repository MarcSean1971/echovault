
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/message";

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

export async function createMessage(userId: string, title: string, content: string | null, messageType: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        title,
        content,
        message_type: messageType
      })
      .select();

    if (error) throw error;
    
    return data?.[0] as Message;
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
}
