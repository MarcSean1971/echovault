
import { corsHeaders } from "../cors-headers.ts";
import { supabaseClient } from "../supabase-client.ts";

/**
 * Handle secure attachment download requests
 */
export async function handleDownloadAttachment(req: Request): Promise<Response> {
  try {
    console.log("[DownloadAttachmentHandler] Processing secure attachment download");
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }), 
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the request payload
    let payload;
    try {
      payload = await req.json();
      console.log("[DownloadAttachmentHandler] Request payload:", JSON.stringify(payload));
    } catch (e) {
      console.error("[DownloadAttachmentHandler] Error parsing request payload:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request payload" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { messageId, deliveryId, recipientEmail, attachmentPath, attachmentName } = payload;
    
    // Validate required parameters
    if (!messageId || !attachmentPath) {
      console.error("[DownloadAttachmentHandler] Missing required parameters", { messageId, attachmentPath });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify access to the message (similar to the message access handler)
    const supabase = supabaseClient();
    
    // Check if message exists
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single();
      
    if (messageError || !message) {
      console.error("[DownloadAttachmentHandler] Message not found:", messageError);
      return new Response(
        JSON.stringify({ error: "Message not found" }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // First check if the recipient is authorized based on email and message conditions
    let isAuthorized = false;
    
    if (recipientEmail) {
      // Get message conditions to check recipients
      const { data: condition, error: conditionError } = await supabase
        .from("message_conditions")
        .select("recipients")
        .eq("message_id", messageId)
        .single();
      
      if (!conditionError && condition && condition.recipients) {
        // Check if recipient email is in the authorized list
        const recipients = condition.recipients;
        isAuthorized = recipients.some((recipient: any) => 
          recipient.email && recipient.email.toLowerCase() === recipientEmail.toLowerCase()
        );
        
        console.log(`[DownloadAttachmentHandler] Recipient authorization check: ${isAuthorized ? 'Authorized' : 'Unauthorized'}`);
      }
    }
    
    // Verify delivery record if deliveryId is provided as an additional check
    let deliveryVerified = false;
    if (deliveryId) {
      console.log(`[DownloadAttachmentHandler] Checking delivery record for ID: ${deliveryId}`);
      const { data: delivery, error: deliveryError } = await supabase
        .from("delivered_messages")
        .select("*")
        .eq("delivery_id", deliveryId)
        .eq("message_id", messageId)
        .maybeSingle();
        
      if (deliveryError) {
        console.error("[DownloadAttachmentHandler] Error checking delivery record:", deliveryError);
      } else if (!delivery) {
        console.error("[DownloadAttachmentHandler] Delivery record not found for:", { deliveryId, messageId });
      } else {
        console.log("[DownloadAttachmentHandler] Delivery record found and verified");
        deliveryVerified = true;
      }
    }
    
    // If neither delivery record exists nor recipient is authorized, deny access
    if (!isAuthorized && !deliveryVerified) {
      console.error("[DownloadAttachmentHandler] Access denied - no valid delivery record or authorized recipient");
      return new Response(
        JSON.stringify({ error: "Not authorized to access this attachment" }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Try to download the attachment
    try {
      console.log("[DownloadAttachmentHandler] Attempting to download attachment:", attachmentPath);
      // First try with hyphen in bucket name
      let fileResponse;
      try {
        fileResponse = await supabase.storage
          .from('message-attachments')
          .download(attachmentPath);
        
        if (fileResponse.error) {
          throw fileResponse.error;
        }
      } catch (error) {
        console.log("[DownloadAttachmentHandler] Error with message-attachments bucket, trying message_attachments:", error);
        
        // Try with underscore
        fileResponse = await supabase.storage
          .from('message_attachments')
          .download(attachmentPath);
        
        if (fileResponse.error) {
          throw fileResponse.error;
        }
      }
      
      // Get the file data
      const fileData = await fileResponse.data.arrayBuffer();
      console.log("[DownloadAttachmentHandler] File download successful, size:", fileData.byteLength);
      
      // Detect content type or use application/octet-stream as fallback
      let contentType = "application/octet-stream";
      const filenameLower = attachmentName.toLowerCase();
      
      if (filenameLower.endsWith('.pdf')) contentType = "application/pdf";
      else if (filenameLower.endsWith('.jpg') || filenameLower.endsWith('.jpeg')) contentType = "image/jpeg";
      else if (filenameLower.endsWith('.png')) contentType = "image/png";
      else if (filenameLower.endsWith('.txt')) contentType = "text/plain";
      else if (filenameLower.endsWith('.doc') || filenameLower.endsWith('.docx')) contentType = "application/msword";
      
      // Set response headers
      const headers = {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(attachmentName)}"`,
        "Cache-Control": "no-cache"
      };
      
      // Return the file
      return new Response(fileData, { headers });
      
    } catch (downloadError) {
      console.error("[DownloadAttachmentHandler] Error downloading attachment:", downloadError);
      return new Response(
        JSON.stringify({ error: "Error downloading attachment", details: downloadError.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error: any) {
    console.error("[DownloadAttachmentHandler] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
