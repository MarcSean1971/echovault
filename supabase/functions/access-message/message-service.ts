
import { supabaseClient } from "./supabase-client.ts";

/**
 * Get message by ID
 */
export async function getMessage(messageId: string) {
  try {
    console.log(`Fetching message with ID: ${messageId}`);
    const supabase = supabaseClient();
    
    // Log the Supabase client configuration (without sensitive data)
    console.log("Supabase client configured for URL:", 
      typeof supabase.supabaseUrl === 'string' ? 
      new URL(supabase.supabaseUrl).hostname : 
      'Unknown');
    
    const response = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single();
    
    if (response.error) {
      console.error(`Error fetching message ${messageId}:`, response.error);
      console.error(`SQL error code: ${response.error.code}, Message: ${response.error.message}, Details: ${response.error.details}`);
    } else if (!response.data) {
      console.error(`No message found with ID ${messageId}`);
    } else {
      console.log(`Successfully fetched message: ${messageId}`);
      console.log(`Message title: "${response.data.title}", type: ${response.data.message_type}`);
    }
    
    return response;
  } catch (error) {
    console.error(`Exception in getMessage for ID ${messageId}:`, error);
    throw error;
  }
}

/**
 * Get message condition by message ID
 */
export async function getMessageCondition(messageId: string) {
  try {
    console.log(`Fetching message condition for message ID: ${messageId}`);
    const supabase = supabaseClient();
    const response = await supabase
      .from("message_conditions")
      .select("*")
      .eq("message_id", messageId)
      .single();
    
    if (response.error) {
      console.error(`Error fetching condition for message ${messageId}:`, response.error);
      console.error(`SQL error code: ${response.error.code}, Message: ${response.error.message}, Details: ${response.error.details}`);
    } else if (!response.data) {
      console.error(`No condition found for message ID ${messageId}`);
    } else {
      console.log(`Successfully fetched condition for message: ${messageId}`);
      console.log(`Condition type: ${response.data.condition_type}, Has PIN: ${!!response.data.pin_code}`);
    }
    
    return response;
  } catch (error) {
    console.error(`Exception in getMessageCondition for ID ${messageId}:`, error);
    throw error;
  }
}
