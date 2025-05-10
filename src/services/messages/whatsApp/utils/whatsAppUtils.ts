import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Recipient } from "@/types/message";
import { Json } from "@/types/supabase";

/**
 * Get recipient details from message condition
 * @param messageId The message ID to get recipients for
 * @returns Object containing recipients and panic config or null if error
 */
export async function getMessageRecipients(messageId: string): Promise<{ 
  recipients: Recipient[] | null;
  panicConfig: any | null;
  error?: string;
}> {
  try {
    // Get recipient details from the message condition
    const { data: condition, error: conditionError } = await supabase
      .from("message_conditions")
      .select("recipients, panic_config")
      .eq("message_id", messageId)
      .single();
    
    if (conditionError || !condition) {
      toast({
        title: "No condition found",
        description: "Could not find condition for this message",
        variant: "destructive"
      });
      return { recipients: null, panicConfig: null, error: "No condition found" };
    }
    
    // Type checking to ensure recipients is an array before using array methods
    const recipients = Array.isArray(condition.recipients) 
      ? (condition.recipients as Json[]).map(jsonToRecipient)
      : [];
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add recipients to this message first",
        variant: "destructive"
      });
      return { recipients: null, panicConfig: null, error: "No recipients found" };
    }
    
    // Cast to proper type for type safety
    const typedRecipients = recipients as Recipient[];
    
    return { 
      recipients: typedRecipients, 
      panicConfig: condition.panic_config 
    };
  } catch (error: any) {
    console.error("Error getting message recipients:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to get message recipients",
      variant: "destructive"
    });
    return { recipients: null, panicConfig: null, error: error.message };
  }
}

/**
 * Get the first recipient with a phone number
 * @param recipients Array of recipients to check
 * @returns First recipient with a phone number or null if none found
 */
export function getPhoneRecipient(recipients: Recipient[]): Recipient | null {
  const recipient = recipients.find(r => r.phone);
  
  if (!recipient || !recipient.phone) {
    toast({
      title: "No WhatsApp number",
      description: "The selected recipient doesn't have a phone number",
      variant: "destructive"
    });
    return null;
  }
  
  return recipient;
}

/**
 * Get message details
 * @param messageId The message ID to get details for
 * @returns Object containing message details or null if error
 */
export async function getMessageDetails(messageId: string) {
  try {
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("title, content, share_location, location_latitude, location_longitude, location_name")
      .eq("id", messageId)
      .single();
    
    if (messageError) {
      throw messageError;
    }
    
    return { message };
  } catch (error: any) {
    console.error("Error getting message details:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to get message details",
      variant: "destructive"
    });
    return { message: null, error };
  }
}

/**
 * Get user profile info for sender details
 * @returns Object containing user profile data or null if error
 */
export async function getSenderInfo() {
  try {
    // Get the user's profile for sender information
    const { data: profile, error: profileError } = await supabase.auth.getUser();
    
    if (profileError) throw profileError;
    
    const userId = profile?.user?.id;
    
    if (!userId) throw new Error("User not authenticated");
    
    const { data: userData, error: userDataError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .single();
      
    if (userDataError) throw userDataError;
    
    // Format sender name
    const senderName = `${userData?.first_name || ""} ${userData?.last_name || ""}`.trim() || "You";
    
    return { senderName, userId };
  } catch (error: any) {
    console.error("Error getting sender info:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to get sender information",
      variant: "destructive"
    });
    return { senderName: "You", userId: null, error };
  }
}

/**
 * Format location information for WhatsApp messages
 * @param message Message object containing location data
 * @returns Formatted location info and map URL
 */
export function formatLocationInfo(message: any) {
  let locationInfo = "Test location";
  let mapUrl = "https://maps.example.com";
  
  if (message?.share_location && message?.location_latitude && message?.location_longitude) {
    locationInfo = message.location_name || `${message.location_latitude}, ${message.location_longitude}`;
    mapUrl = `https://maps.google.com/?q=${message.location_latitude},${message.location_longitude}`;
  }
  
  return { locationInfo, mapUrl };
}

/**
 * Display error toast and log error
 * @param error Error object or message
 * @param operation Description of operation that failed
 */
export function handleWhatsAppError(error: any, operation: string) {
  console.error(`Error ${operation}:`, error);
  
  // Extract detailed error message if available
  let errorMessage = error.message || `Failed to ${operation}`;
  if (error.error && typeof error.error === 'object') {
    errorMessage = error.error.message || errorMessage;
  }
  
  toast({
    title: "WhatsApp Error",
    description: errorMessage,
    variant: "destructive"
  });
}

/**
 * Display success toast
 * @param recipient Recipient information
 */
export function showWhatsAppSuccess(recipient: Recipient) {
  toast({
    title: "WhatsApp message sent",
    description: `Sent to ${recipient.phone}`,
  });
}

// Add Json to Recipient conversion in the whatsApp utils
function jsonToRecipient(json: Json): Recipient {
  if (typeof json !== 'object' || json === null) {
    return {
      id: '',
      name: '',
      email: '',
    };
  }
  
  const obj = json as Record<string, any>;
  return {
    id: obj.id || '',
    name: obj.name || '',
    email: obj.email || '',
    phone: obj.phone,
    relationship: obj.relationship,
    notes: obj.notes,
    deliveryId: obj.deliveryId
  };
}
