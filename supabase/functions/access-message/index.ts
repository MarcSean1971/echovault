import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "./supabase-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HTML template for displaying messages
const renderMessagePage = (
  message: any, 
  isPinProtected: boolean = false,
  isDelayed: boolean = false,
  unlockDate: string | null = null,
  expiryDate: string | null = null,
  isExpired: boolean = false,
  deliveryId: string | null = null,
  recipientEmail: string | null = null
) => {
  const currentDate = new Date().toISOString();
  const formattedUnlockDate = unlockDate ? new Date(unlockDate).toLocaleString() : null;
  const formattedExpiryDate = expiryDate ? new Date(expiryDate).toLocaleString() : null;

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${message.title || 'Secure Message'}</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .message-container {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        margin-top: 20px;
        background-color: #f9f9f9;
      }
      .message-header {
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      .message-content {
        white-space: pre-wrap;
      }
      .message-attachments {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid #eee;
      }
      .attachment-item {
        display: block;
        margin: 5px 0;
        padding: 8px;
        background: #eee;
        border-radius: 4px;
        text-decoration: none;
        color: #333;
      }
      .attachment-item:hover {
        background: #e0e0e0;
      }
      .pin-form {
        margin: 40px auto;
        max-width: 300px;
        text-align: center;
      }
      .pin-input {
        width: 200px;
        padding: 10px;
        font-size: 16px;
        margin-bottom: 10px;
        text-align: center;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .submit-button {
        background: #0070f3;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      .error-message {
        color: #d32f2f;
        margin: 10px 0;
      }
      .info-message {
        background: #fff8e1;
        border-left: 4px solid #ffc107;
        padding: 10px 15px;
        margin: 20px 0;
      }
      .expired-message {
        background: #ffebee;
        border-left: 4px solid #f44336;
        padding: 10px 15px;
        margin: 20px 0;
      }
      .success-message {
        background: #e8f5e9;
        border-left: 4px solid #4caf50;
        padding: 10px 15px;
        margin: 20px 0;
      }
    </style>
  </head>
  <body>
    <h1>Secure Message</h1>
    
    ${isExpired ? `
      <div class="expired-message">
        <strong>This message has expired and is no longer available.</strong>
      </div>
    ` : ''}
    
    ${isDelayed && unlockDate && new Date(unlockDate) > new Date() ? `
      <div class="info-message">
        <strong>This message is not yet available.</strong><br>
        The sender has set this message to become available on ${formattedUnlockDate}.
        Please check back after this time.
      </div>
    ` : ''}
    
    ${expiryDate && !isExpired ? `
      <div class="info-message">
        <strong>This message will expire on ${formattedExpiryDate}.</strong><br>
        Please make sure to save any important information before this date.
      </div>
    ` : ''}

    ${isPinProtected ? `
      <div class="pin-form">
        <h2>PIN Protected Message</h2>
        <p>This message requires a PIN to access. Please enter the PIN provided by the sender.</p>
        <form id="pin-form">
          <input type="hidden" id="message-id" value="${message.id}">
          <input type="hidden" id="delivery-id" value="${deliveryId || ''}">
          <input type="hidden" id="recipient-email" value="${recipientEmail || ''}">
          <input type="text" id="pin-input" class="pin-input" placeholder="Enter PIN" required>
          <div id="pin-error" class="error-message" style="display: none;"></div>
          <button type="submit" class="submit-button">Access Message</button>
        </form>
      </div>
      <script>
        document.getElementById('pin-form').addEventListener('submit', async function(e) {
          e.preventDefault();
          const pin = document.getElementById('pin-input').value;
          const messageId = document.getElementById('message-id').value;
          const deliveryId = document.getElementById('delivery-id').value;
          const recipientEmail = document.getElementById('recipient-email').value;
          
          try {
            const response = await fetch('/functions/v1/access-message/verify-pin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                pin, 
                messageId,
                deliveryId,
                recipientEmail
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              window.location.reload();
            } else {
              document.getElementById('pin-error').textContent = data.error || 'Incorrect PIN';
              document.getElementById('pin-error').style.display = 'block';
            }
          } catch (error) {
            document.getElementById('pin-error').textContent = 'An error occurred. Please try again.';
            document.getElementById('pin-error').style.display = 'block';
          }
        });
      </script>
    ` : `
      <div class="message-container">
        <div class="message-header">
          <h2>${message.title || 'No Title'}</h2>
          <div>Sent: ${new Date(message.created_at).toLocaleString()}</div>
        </div>
        
        <div class="message-content">
          ${message.content || 'No message content'}
        </div>
        
        ${message.attachments && message.attachments.length > 0 ? `
          <div class="message-attachments">
            <h3>Attachments</h3>
            ${message.attachments.map((attachment: any) => `
              <a href="#" class="attachment-item" onclick="alert('Attachments are currently not available for direct download from this secure view. Please contact the sender if you need access to this file.')">
                ${attachment.name} (${(attachment.size / 1024).toFixed(1)} KB)
              </a>
            `).join('')}
          </div>
        ` : ''}
      </div>
      
      <script>
        // Record that this message was viewed
        fetch('/functions/v1/access-message/record-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messageId: '${message.id}', 
            deliveryId: '${deliveryId || ''}',
            recipientEmail: '${recipientEmail || ''}'
          })
        });
      </script>
    `}
  </body>
  </html>
  `;
};

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
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single();
      
    if (messageError) {
      console.error("Error fetching message:", messageError);
      return new Response("Message not found", { 
        status: 404, 
        headers: { "Content-Type": "text/plain", ...corsHeaders } 
      });
    }
    
    // 2. Get the message condition to check security settings and recipients
    const { data: condition, error: conditionError } = await supabase
      .from("message_conditions")
      .select("*")
      .eq("message_id", messageId)
      .single();
      
    if (conditionError) {
      console.error("Error fetching message condition:", conditionError);
      return new Response("Message condition not found", { 
        status: 404, 
        headers: { "Content-Type": "text/plain", ...corsHeaders } 
      });
    }
    
    // 3. Verify that the recipient is authorized to access this message
    const authorizedRecipients = condition.recipients || [];
    const isAuthorized = authorizedRecipients.some((r: any) => 
      r.email && r.email.toLowerCase() === recipientEmail.toLowerCase()
    );
    
    if (!isAuthorized) {
      console.error(`Unauthorized access attempt by ${recipientEmail} for message ${messageId}`);
      return new Response("You are not authorized to access this message", { 
        status: 403, 
        headers: { "Content-Type": "text/plain", ...corsHeaders } 
      });
    }
    
    // 4. Check for message delivery record
    const { data: deliveryRecord, error: deliveryError } = await supabase
      .from("delivered_messages")
      .select("*")
      .eq("delivery_id", deliveryId)
      .eq("message_id", messageId)
      .maybeSingle();
      
    if (deliveryError) {
      console.error("Error checking delivery record:", deliveryError);
    }
    
    if (!deliveryRecord) {
      console.warn(`No delivery record found for message ${messageId} with delivery ID ${deliveryId}`);
      // Try to create a delivery record if it doesn't exist
      try {
        // Find the recipient ID from the authorized recipients list
        const recipient = authorizedRecipients.find((r: any) => 
          r.email && r.email.toLowerCase() === recipientEmail.toLowerCase()
        );
        
        if (recipient && recipient.id) {
          const { error: createError } = await supabase
            .from("delivered_messages")
            .insert({
              message_id: messageId,
              condition_id: condition.id,
              recipient_id: recipient.id,
              delivery_id: deliveryId,
              delivered_at: new Date().toISOString()
            });
            
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
    
    let unlockDate = null;
    if (hasDelayedAccess) {
      unlockDate = new Date(deliveryDate);
      unlockDate.setHours(unlockDate.getHours() + (condition.unlock_delay_hours || 0));
    }
    
    let expiryDate = null;
    let isExpired = false;
    if (hasExpiry) {
      expiryDate = new Date(deliveryDate);
      expiryDate.setHours(expiryDate.getHours() + (condition.expiry_hours || 0));
      isExpired = expiryDate < new Date();
    }
    
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

// Handle PIN verification
const handleVerifyPin = async (req: Request): Promise<Response> => {
  try {
    // Parse the request body
    const { pin, messageId, deliveryId, recipientEmail } = await req.json();
    
    if (!pin || !messageId || !deliveryId || !recipientEmail) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required parameters" 
      }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }
    
    // Create Supabase client
    const supabase = supabaseClient();
    
    // Get the message condition to check PIN
    const { data: condition, error: conditionError } = await supabase
      .from("message_conditions")
      .select("pin_code")
      .eq("message_id", messageId)
      .single();
      
    if (conditionError || !condition) {
      console.error("Error fetching message condition:", conditionError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Message condition not found" 
      }), { 
        status: 404, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }
    
    // Verify PIN
    if (condition.pin_code !== pin) {
      console.warn(`Incorrect PIN attempt for message ${messageId}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Incorrect PIN" 
      }), { 
        status: 401, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }
    
    // PIN is correct, update delivery record
    const { data: deliveryRecord, error: deliveryError } = await supabase
      .from("delivered_messages")
      .update({ 
        viewed_at: new Date().toISOString(),
        viewed_count: 1
      })
      .eq("delivery_id", deliveryId)
      .eq("message_id", messageId)
      .select();
      
    if (deliveryError) {
      console.error("Error updating delivery record:", deliveryError);
      // Continue anyway, PIN verification succeeded
    }
    
    return new Response(JSON.stringify({ 
      success: true 
    }), { 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    });
    
  } catch (error: any) {
    console.error("Error verifying PIN:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Error processing request" 
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    });
  }
};

// Handle recording message view
const handleRecordView = async (req: Request): Promise<Response> => {
  try {
    // Parse the request body
    const { messageId, deliveryId, recipientEmail } = await req.json();
    
    if (!messageId || !deliveryId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required parameters" 
      }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }
    
    // Create Supabase client
    const supabase = supabaseClient();
    
    // Check if the delivered_messages table exists
    try {
      // Update delivery record
      const { data, error } = await supabase
        .from("delivered_messages")
        .update({ 
          viewed_at: new Date().toISOString(),
          viewed_count: 1,
          device_info: req.headers.get("user-agent") || null
        })
        .eq("delivery_id", deliveryId)
        .eq("message_id", messageId);
        
      if (error) {
        console.error("Error recording message view:", error);
        
        // If table doesn't exist, try to create it through our function
        if (error.code === "42P01") {
          console.warn("Delivered messages table not found. It may need to be created.");
        }
        
        // Return success anyway to avoid breaking the user experience
        return new Response(JSON.stringify({ 
          success: true,
          message: "View tracking is not available at this time"
        }), { 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        });
      }
      
      return new Response(JSON.stringify({ 
        success: true 
      }), { 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    } catch (error: any) {
      console.error("Error in record view handling:", error);
      
      // Return success anyway to avoid breaking the user experience
      return new Response(JSON.stringify({ 
        success: true,
        message: "View recorded (with warnings)" 
      }), { 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }
  } catch (error: any) {
    console.error("Error recording message view:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Error processing request" 
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    });
  }
};

// Start the HTTP server
serve(handleRequest);
