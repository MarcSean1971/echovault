
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
      console.error("[DownloadAttachmentHandler] Missing required parameters");
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
    
    // Verify delivery record if deliveryId is provided
    if (deliveryId) {
      const { data: delivery, error: deliveryError } = await supabase
        .from("delivered_messages")
        .select("*")
        .eq("delivery_id", deliveryId)
        .eq("message_id", messageId)
        .maybeSingle();
        
      if (deliveryError || !delivery) {
        console.error("[DownloadAttachmentHandler] Delivery record not found:", deliveryError);
        return new Response(
          JSON.stringify({ error: "Invalid delivery ID" }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Try to download the attachment
    try {
      // First try with hyphen in bucket name
      let fileResponse;
      try {
        fileResponse = await supabase.storage
          .from('message-attachments')
          .download(attachmentPath);
      } catch (error) {
        console.log("[DownloadAttachmentHandler] Error with message-attachments bucket, trying message_attachments:", error);
        
        // Try with underscore
        fileResponse = await supabase.storage
          .from('message_attachments')
          .download(attachmentPath);
      }
      
      if (fileResponse.error) {
        throw fileResponse.error;
      }
      
      // Get the file data
      const fileData = await fileResponse.data.arrayBuffer();
      
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
        JSON.stringify({ error: "Error downloading attachment" }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error("[DownloadAttachmentHandler] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
