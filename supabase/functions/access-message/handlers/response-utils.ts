
import { corsHeaders } from "../cors-headers.ts";
import { renderMessagePage, renderErrorPage } from "../template.ts";

// HTML headers used across all responses
export const htmlHeaders = { 
  "Content-Type": "text/html; charset=utf-8", 
  ...corsHeaders 
};

/**
 * Generate response for expired messages
 */
export function generateExpiredMessageResponse(
  message: any, 
  expiryDate: Date | null, 
  deliveryId: string, 
  recipientEmail: string
): Response {
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

/**
 * Generate response for delayed messages
 */
export function generateDelayedMessageResponse(
  message: any,
  unlockDate: Date,
  expiryDate: Date | null,
  deliveryId: string,
  recipientEmail: string
): Response {
  const html = renderMessagePage(
    { id: message.id, title: message.title, created_at: message.created_at },
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

/**
 * Generate response for PIN protected messages
 */
export function generatePinProtectedResponse(
  message: any,
  expiryDate: Date | null,
  deliveryId: string,
  recipientEmail: string
): Response {
  console.log("Sending PIN protected message - PIN is required and not verified");
  const html = renderMessagePage(
    { id: message.id, title: "PIN Protected Message" },
    true,  // Is PIN protected
    false, // Not delayed
    null,
    expiryDate?.toISOString(),
    false, // Not expired
    deliveryId,
    recipientEmail
  );
  
  console.log("Sending PIN protected message HTML response with Content-Type:", htmlHeaders["Content-Type"]);
  return new Response(html, { headers: htmlHeaders });
}

/**
 * Generate response for full message content
 */
export function generateFullMessageResponse(
  message: any,
  expiryDate: Date | null,
  deliveryId: string,
  recipientEmail: string
): Response {
  console.log("Security checks passed, showing full message content");
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
  console.log(`HTML response length: ${html.length} bytes`);
  
  return new Response(html, { headers: htmlHeaders });
}

/**
 * Generate an error response
 */
export function generateErrorResponse(title: string, message: string, status: number = 500): Response {
  const errorHtml = renderErrorPage(title, message);
  return new Response(errorHtml, { 
    status: status, 
    headers: htmlHeaders
  });
}
