
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "./supabase-client.ts";
import { corsHeaders } from "./cors-headers.ts";
import { renderMessagePage } from "./template.ts";
import { getMessage, getMessageCondition } from "./message-service.ts";
import { findRecipientByEmail } from "./security-service.ts";
import { handleVerifyPin } from "./handlers/verify-pin-handler.ts";
import { handleRecordView } from "./handlers/record-view-handler.ts";
import { validateMessageRequest, validateMessageAuthorization, checkSecurityConditions } from "./message-validator.ts";
import { getDeliveryRecord, createDeliveryRecord } from "./delivery-service.ts";

// URL path handler - parses the URL path to extract messageId and other info
const handleRequest = async (req: Request): Promise<Response> => {
  // Set HTML content type for all HTML responses with proper headers
  const htmlHeaders = { 
    "Content-Type": "text/html; charset=utf-8", 
    ...corsHeaders 
  };
  
  // Set JSON content type for all JSON responses
  const jsonHeaders = { 
    "Content-Type": "application/json", 
    ...corsHeaders 
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`Received request: ${req.url}`);
    console.log(`Request method: ${req.method}`);
    const url = new URL(req.url);
    console.log(`Parsed URL path: ${url.pathname}, search: ${url.search}`);
    console.log(`Request headers:`, Object.fromEntries(req.headers.entries()));
    const pathParts = url.pathname.split('/');
    
    // Check for PIN verification endpoint
    if (pathParts[pathParts.length - 1] === "verify-pin") {
      console.log("Processing verify-pin request");
      return await handleVerifyPin(req);
    }
    
    // Check for record view endpoint
    if (pathParts[pathParts.length - 1] === "record-view") {
      console.log("Processing record-view request");
      return await handleRecordView(req);
    }
    
    // Validate request parameters
    let messageId, recipientEmail, deliveryId;
    try {
      const validatedParams = await validateMessageRequest(url);
      messageId = validatedParams.messageId;
      recipientEmail = validatedParams.recipientEmail;
      deliveryId = validatedParams.deliveryId;
      console.log(`Validated params: messageId=${messageId}, recipient=${recipientEmail}, deliveryId=${deliveryId}`);
    } catch (paramError: any) {
      console.error("Parameter validation error:", paramError.message);
      const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <title>Error</title>
          </head>
          <body>
            <h1>Error</h1>
            <p>${paramError.message}</p>
          </body>
        </html>
      `;
      return new Response(errorHtml, { 
        status: 400, 
        headers: htmlHeaders
      });
    }
    
    console.log(`Access request for message ${messageId} by recipient ${recipientEmail} with delivery ID ${deliveryId}`);
    
    // Validate message authorization
    let message, condition, authorizedRecipients;
    try {
      const authResult = await validateMessageAuthorization(messageId, recipientEmail);
      message = authResult.message;
      condition = authResult.condition;
      authorizedRecipients = authResult.authorizedRecipients;
    } catch (authError: any) {
      console.error("Authorization error:", authError.message);
      const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <title>Access Denied</title>
          </head>
          <body>
            <h1>Access Denied</h1>
            <p>${authError.message}</p>
          </body>
        </html>
      `;
      return new Response(errorHtml, { 
        status: authError.message.includes("not found") ? 404 : 403, 
        headers: htmlHeaders
      });
    }
    
    // Check for message delivery record
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
    
    // Check security settings
    const { 
      hasPinCode, 
      hasDelayedAccess, 
      hasExpiry, 
      unlockDate, 
      expiryDate, 
      isExpired, 
      pinVerified 
    } = checkSecurityConditions(condition, deliveryRecord);
    
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
      
      console.log("Sending expired message HTML response with Content-Type:", htmlHeaders["Content-Type"]);
      return new Response(html, { headers: htmlHeaders });
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
      
      console.log("Sending delayed message HTML response with Content-Type:", htmlHeaders["Content-Type"]);
      return new Response(html, { headers: htmlHeaders });
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
      
      console.log("Sending PIN protected message HTML response with Content-Type:", htmlHeaders["Content-Type"]);
      return new Response(html, { headers: htmlHeaders });
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
    
    console.log("Sending full message HTML response with Content-Type:", htmlHeaders["Content-Type"]);
    // Check if HTML is valid and content length
    console.log(`HTML response length: ${html.length} bytes`);
    
    return new Response(html, { headers: htmlHeaders });
    
  } catch (error: any) {
    console.error("Error processing request:", error);
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <title>Error</title>
        </head>
        <body>
          <h1>Error</h1>
          <p>Error processing request: ${error.message}</p>
        </body>
      </html>
    `;
    return new Response(errorHtml, { 
      status: 500, 
      headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders }
    });
  }
};

// Start the HTTP server
console.log("Starting access-message server...");
serve(handleRequest);
