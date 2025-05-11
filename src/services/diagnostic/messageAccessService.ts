
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/message";
import { toast } from "@/components/ui/use-toast";

type LogCallback = (text: string) => void;

export const checkDeliveryRecord = async (
  messageId: string,
  deliveryId: string,
  addLog: LogCallback
) => {
  if (!messageId || !deliveryId) {
    toast({
      title: "Missing Parameters",
      description: "Please provide both Message ID and Delivery ID",
      variant: "destructive"
    });
    return false;
  }
  
  addLog(`Checking delivery record: message=${messageId}, delivery=${deliveryId}`);
  
  try {
    const { data, error } = await supabase
      .from('delivered_messages')
      .select('*')
      .eq('message_id', messageId)
      .eq('delivery_id', deliveryId);
      
    if (error) {
      addLog(`Error: ${error.message}`);
      toast({
        title: "Database Error",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } else if (!data || data.length === 0) {
      addLog('No delivery record found');
      toast({
        title: "Not Found",
        description: "No delivery record matching these parameters",
        variant: "destructive"
      });
      return false;
    } else {
      addLog(`Success! Found delivery record: ${JSON.stringify(data[0])}`);
      toast({
        title: "Delivery Found",
        description: "A matching delivery record exists in the database"
      });
      return true;
    }
  } catch (e) {
    addLog(`Exception: ${(e as Error).message}`);
    return false;
  }
};

export const loadMessageDirect = async (
  messageId: string,
  addLog: LogCallback
): Promise<Message | null> => {
  if (!messageId) {
    toast({
      title: "Missing Message ID",
      description: "Please provide a Message ID",
      variant: "destructive"
    });
    return null;
  }
  
  addLog(`Direct message load attempt for: ${messageId}`);
  
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .maybeSingle();
      
    if (error) {
      addLog(`Error: ${error.message}`);
      throw new Error(error.message);
    } else if (!data) {
      addLog('Message not found');
      throw new Error("Message not found");
    } else {
      // Transform the raw data to match the Message type format with all required properties
      const transformedMessage: Message = {
        ...data,
        attachments: Array.isArray(data.attachments) 
          ? data.attachments.map((att: any) => ({
              path: att.path || '',
              name: att.name || '',
              size: att.size || 0,
              type: att.type || '',
            }))
          : null,
        // Add the required properties that might be missing from the database
        // Use type assertion to tell TypeScript that data might have these properties
        expires_at: (data as any).expires_at || null,
        sender_name: (data as any).sender_name || null
      };
      addLog(`Success! Loaded message: "${data.title}"`);
      return transformedMessage;
    }
  } catch (e) {
    addLog(`Exception: ${(e as Error).message}`);
    throw e;
  }
};

export const loadMessageSecure = async (
  messageId: string,
  deliveryId: string,
  recipientEmail: string,
  addLog: LogCallback
): Promise<Message | null> => {
  if (!messageId || !deliveryId || !recipientEmail) {
    toast({
      title: "Missing Parameters",
      description: "Please provide Message ID, Delivery ID and Recipient Email",
      variant: "destructive"
    });
    return null;
  }
  
  addLog(`Secure message load attempt: message=${messageId}, delivery=${deliveryId}, recipient=${recipientEmail}`);
  
  try {
    // Try the edge function first
    addLog("Attempting to use edge function...");
    const { data: edgeFnResult, error: edgeFnError } = await supabase.functions.invoke("access-message", {
      body: { 
        messageId, 
        deliveryId, 
        recipientEmail: recipientEmail,
        bypassSecurity: false
      }
    });
    
    if (edgeFnError) {
      addLog(`Edge function error: ${edgeFnError.message}`);
      throw new Error(`Edge function error: ${edgeFnError.message}`);
    } else if (edgeFnResult.error) {
      addLog(`Access verification failed: ${edgeFnResult.error}`);
      throw new Error(edgeFnResult.error);
    } else if (edgeFnResult.success) {
      // Transform the message to ensure it conforms to our expected Message type
      const transformedMessage: Message = {
        ...edgeFnResult.message,
        attachments: Array.isArray(edgeFnResult.message.attachments)
          ? edgeFnResult.message.attachments.map((att: any) => ({
              path: att.path || '',
              name: att.name || '',
              size: att.size || 0,
              type: att.type || ''
            }))
          : null,
        // Ensure expires_at and sender_name are present in the transformed message
        // Use type assertion to tell TypeScript that edgeFnResult.message might have these properties
        expires_at: (edgeFnResult.message as any).expires_at || null,
        sender_name: (edgeFnResult.message as any).sender_name || null
      };
      addLog(`Success! Edge function loaded message: "${edgeFnResult.message.title}"`);
      return transformedMessage;
    }
    return null;
  } catch (e) {
    throw e;
  }
};

export const loadMessageBypass = async (
  messageId: string,
  addLog: LogCallback
): Promise<Message | null> => {
  if (!messageId) {
    toast({
      title: "Missing Message ID",
      description: "Please provide a Message ID",
      variant: "destructive"
    });
    return null;
  }
  
  addLog(`Bypass security message load for: ${messageId}`);
  
  try {
    const { data: edgeFnResult, error: edgeFnError } = await supabase.functions.invoke("access-message", {
      body: { 
        messageId, 
        bypassSecurity: true
      }
    });
    
    if (edgeFnError) {
      addLog(`Edge function error: ${edgeFnError.message}`);
      throw new Error(`Edge function error: ${edgeFnError.message}`);
    } else if (edgeFnResult.error) {
      addLog(`Access verification failed: ${edgeFnResult.error}`);
      throw new Error(edgeFnResult.error);
    } else if (edgeFnResult.success) {
      // Transform the message to ensure it conforms to our expected Message type
      const transformedMessage: Message = {
        ...edgeFnResult.message,
        attachments: Array.isArray(edgeFnResult.message.attachments)
          ? edgeFnResult.message.attachments.map((att: any) => ({
              path: att.path || '',
              name: att.name || '',
              size: att.size || 0,
              type: att.type || ''
            }))
          : null,
        // Ensure expires_at and sender_name are present in the transformed message
        // Use type assertion to tell TypeScript that edgeFnResult.message might have these properties
        expires_at: (edgeFnResult.message as any).expires_at || null,
        sender_name: (edgeFnResult.message as any).sender_name || null
      };
      addLog(`Success! Bypass mode loaded message: "${edgeFnResult.message.title}"`);
      return transformedMessage;
    }
    return null;
  } catch (e) {
    throw e;
  }
};
