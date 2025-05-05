
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  console.log(`[FileAccess] Path: ${url.pathname}`);
  console.log(`[FileAccess] Method: ${req.method}`);
  
  // Initialize Supabase client with service role key for admin access
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  
  try {
    // Extract file path from URL if present
    if (pathParts.length >= 2 && pathParts[0] === 'file') {
      const filePath = pathParts[1];
      
      // Get query parameters for security validation
      const deliveryId = url.searchParams.get('delivery');
      const recipientEmail = url.searchParams.get('recipient');
      
      if (!deliveryId || !recipientEmail) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      console.log(`[FileAccess] Validating access for delivery: ${deliveryId}, recipient: ${recipientEmail}`);
      
      // Validate that the delivery exists and matches the recipient
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('delivered_messages')
        .select('message_id, recipient_id')
        .eq('delivery_id', deliveryId)
        .single();
      
      if (deliveryError || !deliveryData) {
        console.error(`[FileAccess] Invalid delivery: ${deliveryError?.message}`);
        return new Response(
          JSON.stringify({ error: "Invalid delivery ID" }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // Verify the recipient email matches
      const { data: recipientData, error: recipientError } = await supabase
        .from('recipients')
        .select('id, email')
        .eq('id', deliveryData.recipient_id)
        .single();
      
      if (recipientError || !recipientData) {
        console.error(`[FileAccess] Invalid recipient: ${recipientError?.message}`);
        return new Response(
          JSON.stringify({ error: "Invalid recipient" }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // Compare emails with case-insensitive matching
      const dbEmail = recipientData.email.toLowerCase();
      const requestEmail = decodeURIComponent(recipientEmail).toLowerCase();
      
      if (dbEmail !== requestEmail) {
        console.error(`[FileAccess] Email mismatch: DB=${dbEmail}, Request=${requestEmail}`);
        return new Response(
          JSON.stringify({ error: "Unauthorized access attempt" }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // Access has been validated, now get the message to verify the attachment path
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('attachments')
        .eq('id', deliveryData.message_id)
        .single();
      
      if (messageError || !messageData) {
        console.error(`[FileAccess] Message not found: ${messageError?.message}`);
        return new Response(
          JSON.stringify({ error: "Message not found" }),
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // Validate the requested file path exists in the message attachments
      const attachments = messageData.attachments || [];
      const requestedAttachment = attachments.find((att: any) => att.path === filePath);
      
      if (!requestedAttachment) {
        console.error(`[FileAccess] Attachment not found: ${filePath}`);
        return new Response(
          JSON.stringify({ error: "Attachment not found in message" }),
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      console.log(`[FileAccess] Validated access to file: ${filePath}`);
      
      // Determine which bucket to use
      const bucketName = await getBucket(supabase);
      
      if (!bucketName) {
        return new Response(
          JSON.stringify({ error: "Storage bucket not found" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // Get the file data directly using service role permissions
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from(bucketName)
        .download(filePath);
      
      if (fileError) {
        console.error(`[FileAccess] File download error: ${fileError.message}`);
        return new Response(
          JSON.stringify({ error: "Error accessing file", details: fileError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // Success - return the file with proper Content-Type
      const headers = {
        ...corsHeaders,
        "Content-Type": requestedAttachment.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${requestedAttachment.name}"`,
      };
      
      console.log(`[FileAccess] Successfully served file: ${filePath}`);
      
      return new Response(fileData, { headers });
    }
    
    // Default handler - not found
    return new Response(
      JSON.stringify({ error: "Not found", path: url.pathname }),
      { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in access-file function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error", 
        stack: error.stack,
        path: url.pathname
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Helper function to get the appropriate bucket name
async function getBucket(supabase: any) {
  const bucketNames = ['message-attachments', 'message_attachments'];
  
  for (const name of bucketNames) {
    try {
      const { data } = await supabase.storage.getBucket(name);
      if (data) {
        return name;
      }
    } catch (e) {
      console.log(`Bucket ${name} not found, trying next option`);
    }
  }
  
  return null;
}
