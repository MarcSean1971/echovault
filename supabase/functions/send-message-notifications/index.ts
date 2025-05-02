
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getMessagesToNotify } from "./db-service.ts";
import { sendMessageNotification } from "./notification-service.ts";
import { MessageNotificationRequest } from "./types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the message ID if provided in the request body
    const requestData: MessageNotificationRequest = await req.json().catch(() => ({}));
    const { messageId } = requestData;
    
    console.log(`Processing message notifications${messageId ? ` for message ID: ${messageId}` : ''}`);

    // Get messages that need notification
    const messagesToNotify = await getMessagesToNotify(messageId);
    console.log(`Found ${messagesToNotify.length} messages to notify`);

    // Send notifications for each message
    const results = await Promise.all(messagesToNotify.map(sendMessageNotification));
    
    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        messages_processed: messagesToNotify.length,
        successful_notifications: successful,
        failed_notifications: failed
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-message-notifications function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
