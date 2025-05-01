
import { getAuthClient } from "@/lib/supabaseClient";
import { MessageStatusResult } from "./types";

export async function getMessageStatus(messageId: string): Promise<MessageStatusResult> {
  const client = await getAuthClient();
  
  try {
    const { data, error } = await client
      .from("message_conditions")
      .select("*, messages!inner(*)")
      .eq("message_id", messageId)
      .single();
      
    if (error) {
      throw new Error("Message not found");
    }
    
    // Calculate status based on condition fields
    // Since we don't have triggered/delivered in DB yet, we'll determine from active
    let status = 'armed';
    
    if (!data.active) {
      status = 'delivered'; // For now, we'll use active=false to mean delivered
    }
    
    // TODO: In future we'd check for viewed/unlocked statuses from recipient_interactions table
    
    return {
      id: data.id,
      message_id: data.message_id,
      status,
      active: data.active,
      condition_type: data.condition_type
    };
  } catch (error: any) {
    console.error("Error getting message status:", error);
    throw new Error(error.message || "Failed to get message status");
  }
}
