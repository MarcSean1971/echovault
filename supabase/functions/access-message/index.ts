
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "./supabase-client.ts";
import { corsHeaders } from "./cors-headers.ts";
import { renderMessagePage } from "./template.ts";
import { getMessage, getMessageCondition, getDeliveryRecord, createDeliveryRecord } from "./message-service.ts";
import { calculateSecurityDates, isAuthorizedRecipient, findRecipientByEmail } from "./security-service.ts";
import { handleVerifyPin } from "./handlers/verify-pin-handler.ts";
import { handleRecordView } from "./handlers/record-view-handler.ts";

// URL path handler - parses the URL path to extract messageId and other info
const handleRequest = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    
    // Check for PIN verification endpoint
    if (pathParts[pathParts.length - 1] === "verify-pin") {
      return await handleVerifyPin(req);
    }
    
    // Check for record view endpoint
    if (pathParts[pathParts.length - 1] === "record-view") {
      return await handleRecordView(req);
    }
    
    // Try to extract message ID from query parameters first
    let messageId = url.searchParams.get("id");
    
    // If not found in query params, try to extract from URL path (backwards compatibility)
    if (!messageId) {
      messageId = pathParts[pathParts.length - 1];
      // If last path part is the function name itself, then there's no ID in the path
      if (messageId === "access-message") {
        messageId = null;
      }
    }
    
    if (!messageId) {
      console.error("Missing message ID in both query parameters and URL path");
      return new Response("Missing message ID - Please check the URL format", { 
        status: 400, 
        headers: { "Content-Type": "text/plain", ...corsHeaders } 
      });
    }
    
    // Extract recipient and delivery info from query parameters
    const recipientEmail = url.searchParams.get("recipient");
    const deliveryId = url.searchParams.get("delivery");
    
    if (!recipientEmail || !deliveryId) {
      console.error(`Missing recipient (${recipientEmail}) or delivery information (${deliveryId})`);
      return new Response("Missing recipient or delivery information", { 
        status: 400, 
        headers: { "Content-Type": "text/plain", ...corsHeaders } 
      });
    }
    
    console.log(`Access request for message ${messageId} by recipient ${recipientEmail} with delivery ID ${deliveryId}`);
    
    // Create Supabase client
    const supabase = supabaseClient();
    
    // 1. Get the message
    const { data: message, error: messageError } = await getMessage(messageId);
      
    if (messageError) {
      console.error("Error fetching message:", messageError);
      return new Response("Message not found", { 
        status: 404, 
        headers: { "Content-Type": "text/plain", ...corsHeaders } 
      });
    }
    
    // 2. Get the message condition to check security settings and recipients
    const { data: condition, error: conditionError } = await getMessageCondition(messageId);
      
    if (conditionError) {
      console.error("Error fetching message condition:", conditionError);
      return new Response("Message condition not found", { 
        status: 404, 
        headers: { "Content-Type": "text/plain", ...corsHeaders } 
      });
    }
    
    // 3. Verify that the recipient is authorized to access this message
    const authorizedRecipients = condition.recipients || [];
    const isAuthorized = isAuthorizedRecipient(authorizedRecipients, recipientEmail);
    
    if (!isAuthorized) {
      console.error(`Unauthorized access attempt by ${recipientEmail} for message ${messageId}`);
      return new Response("You are not authorized to access this message", { 
        status: 403, 
        headers: { "Content-Type": "text/plain", ...corsHeaders } 
      });
    }
    
    // 4. Check for message delivery record
    const { data: deliveryRecord, error: deliveryError } = await getDeliveryRecord(messageId, deliveryId);
      
    if (deliveryError) {
      console.error("Error checking delivery record:", deliveryError);
    }
    
    if (!deliveryRecord) {
      console.warn(`No delivery record found for message ${messageId} with delivery ID ${deliveryId}`);
      // Try to create a delivery record if it doesn't exist
      try {
        // Find the recipient ID from the authorized recipients list
        const recipient = findRecipientByEmail(authorizedRecipients, recipientEmail);
        
        if (recipient && recipient.id) {
          const { error: createError } = await createDeliveryRecord(
            messageId,
            condition.id,
            recipient.id,
            deliveryId
          );
            
          if (createError) {
            console.error("Error creating delivery record:", createError);
            // Continue as the user is already authorized
          } else {
            console.log(`Created delivery record for message ${messageId} and recipient ${recipient.id}`);
          }
        }
      } catch (recordError) {
        console.error("Error creating delivery record:", recordError);
        // Continue anyway as the recipient is authorized
      }
    }
    
    // 5. Check security settings
    const hasPinCode = !!condition.pin_code;
    const hasDelayedAccess = (condition.unlock_delay_hours || 0) > 0;
    const hasExpiry = (condition.expiry_hours || 0) > 0;
    
    // Calculate dates for delay and expiry
    const deliveryDate = deliveryRecord?.delivered_at 
      ? new Date(deliveryRecord.delivered_at) 
      : new Date(); // Fallback to current time if delivery date not available
    
    const { unlockDate, expiryDate, isExpired } = calculateSecurityDates(
      deliveryDate, 
      hasDelayedAccess, 
      hasExpiry, 
      condition.unlock_delay_hours || 0, 
      condition.expiry_hours || 0
    );
    
    // 6. Check if the PIN has been verified for this session
    const pinVerified = deliveryRecord?.viewed_count && deliveryRecord.viewed_count > 0;
    
    // If expired, show expired message
    if (isExpired) {
      const html = renderMessagePage(
        message,
        false, // No PIN needed for expired messages
        false, // No delay needed for expired messages
        null,
        expiryDate?.toISOString(),
        true, // isExpired
        deliveryId,
        recipientEmail
      );
      
      return new Response(html, { 
        headers: { "Content-Type": "text/html", ...corsHeaders } 
      });
    }
    
    // If delayed access and still within delay period, show waiting message
    if (hasDelayedAccess && unlockDate && unlockDate > new Date()) {
      const html = renderMessagePage(
        { id: messageId, title: message.title, created_at: message.created_at },
        false, // No PIN for delay message
        true,  // Is delayed
        unlockDate.toISOString(),
        expiryDate?.toISOString(),
        false, // Not expired
        deliveryId,
        recipientEmail
      );
      
      return new Response(html, { 
        headers: { "Content-Type": "text/html", ...corsHeaders } 
      });
    }
    
    // If PIN protected and not yet verified, show PIN form
    if (hasPinCode && !pinVerified) {
      const html = renderMessagePage(
        { id: messageId, title: "PIN Protected Message" },
        true,  // Is PIN protected
        false, // Not delayed (already passed delay check)
        null,
        expiryDate?.toISOString(),
        false, // Not expired
        deliveryId,
        recipientEmail
      );
      
      return new Response(html, { 
        headers: { "Content-Type": "text/html", ...corsHeaders } 
      });
    }
    
    // All security checks passed, show the message
    const html = renderMessagePage(
      message,
      false, // PIN already verified or not required
      false, // Delay already passed or not required
      null,
      expiryDate?.toISOString(),
      false, // Not expired
      deliveryId,
      recipientEmail
    );
    
    return new Response(html, { 
      headers: { "Content-Type": "text/html", ...corsHeaders } 
    });
    
  } catch (error: any) {
    console.error("Error processing request:", error);
    return new Response(`Error processing request: ${error.message}`, { 
      status: 500, 
      headers: { "Content-Type": "text/plain", ...corsHeaders } 
    });
  }
};

// Start the HTTP server
serve(handleRequest);
