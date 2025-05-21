
import { supabaseClient } from "../supabase-client.ts";

/**
 * Get a message and its condition details
 */
export async function getMessageAndCondition(messageId: string, conditionId?: string) {
  try {
    const supabase = supabaseClient();
    
    // Get the message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single();
    
    if (messageError) {
      console.error("Error fetching message:", messageError);
      return { message: null, condition: null, error: messageError };
    }
    
    // Get the condition
    let conditionQuery = supabase
      .from("message_conditions")
      .select("*");
    
    if (conditionId) {
      conditionQuery = conditionQuery.eq("id", conditionId);
    } else {
      conditionQuery = conditionQuery.eq("message_id", messageId);
    }
    
    const { data: condition, error: conditionError } = await conditionQuery.single();
    
    if (conditionError) {
      console.error("Error fetching condition:", conditionError);
      return { message, condition: null, error: conditionError };
    }
    
    return { message, condition, error: null };
  } catch (error) {
    console.error("Error in getMessageAndCondition:", error);
    return { message: null, condition: null, error };
  }
}
