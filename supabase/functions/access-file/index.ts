
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("[AccessFile] Starting simplified file access function");

serve(async (req: Request) => {
  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the URL and extract parameters
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    console.log(`[AccessFile] Request path: ${url.pathname}`);

    // Check for POST method first - allows for body parameters
    if (req.method === 'POST') {
      // Handle the POST request
      try {
        const body = await req.json();
        const { filePath, delivery, recipient, mode, download } = body;
        
        if (!filePath || !delivery || !recipient) {
          return new Response(
            JSON.stringify({ error: "Missing required parameters in request body" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Return URL for client to use
        return new Response(
          JSON.stringify({ 
            url: `https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/access-file/file/${encodeURIComponent(filePath)}?delivery=${encodeURIComponent(delivery)}&recipient=${encodeURIComponent(recipient)}&mode=${mode || 'view'}&download-file=${!!download}` 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        console.error(`[AccessFile] Error parsing request body: ${e.message}`);
        return new Response(
          JSON.stringify({ error: "Invalid request body" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Get file path from the URL
    if (pathParts.length < 3 || pathParts[0] !== 'access-file' || pathParts[1] !== 'file') {
      return new Response(
        JSON.stringify({ error: "Invalid path format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Extract file path and decode it
    let filePath = pathParts.slice(2).join('/');
    try {
      filePath = decodeURIComponent(filePath);
    } catch (e) {
      console.error(`[AccessFile] Error decoding path: ${e.message}`);
    }
    
    // Get security parameters
    const deliveryId = url.searchParams.get('delivery');
    const recipientEmail = url.searchParams.get('recipient');
    const downloadMode = url.searchParams.has('download-file') || 
                         url.searchParams.get('mode') === 'download';

    // Get auth token from header, URL parameter, or fallback to service role
    let authToken = req.headers.get('Authorization');
    const authParamToken = url.searchParams.get('auth_token');
    
    console.log(`[AccessFile] File: ${filePath}, Delivery: ${deliveryId}, Download: ${downloadMode}`);
    console.log(`[AccessFile] Auth Header: ${authToken ? 'Present' : 'Missing'}, Auth Param: ${authParamToken ? 'Present' : 'Missing'}`);
    
    // Validate required parameters
    if (!deliveryId || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters (delivery ID and recipient)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create Supabase client - forward the authorization header if present
    // This is critical to fix the "Missing authorization header" error
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: authToken ? { 
          Authorization: authToken 
        } : (authParamToken ? {
          Authorization: `Bearer ${authParamToken}`
        } : {})
      }
    });
    
    // First, get the delivered_message record
    const { data: deliveryData, error: deliveryError } = await supabase
      .from('delivered_messages')
      .select('message_id, recipient_id, condition_id')
      .eq('delivery_id', deliveryId)
      .single();
      
    if (deliveryError) {
      console.error(`[AccessFile] Delivery error: ${deliveryError.message}`);
      return new Response(
        JSON.stringify({ error: "Invalid delivery ID" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!deliveryData) {
      return new Response(
        JSON.stringify({ error: "Delivery ID not found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Second, get the recipient record using recipient_id
    const { data: recipientData, error: recipientError } = await supabase
      .from('recipients')
      .select('email')
      .eq('id', deliveryData.recipient_id)
      .single();
      
    if (recipientError || !recipientData) {
      console.error(`[AccessFile] Recipient error: ${recipientError?.message || "Recipient not found"}`);
      return new Response(
        JSON.stringify({ error: "Invalid recipient" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verify the recipient email
    if (recipientData.email.toLowerCase() !== recipientEmail.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Recipient email does not match" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the message to verify the attachment exists
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .select('attachments')
      .eq('id', deliveryData.message_id)
      .single();
      
    if (messageError || !messageData) {
      return new Response(
        JSON.stringify({ error: "Message not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verify the attachment exists in the message
    const attachments = messageData.attachments || [];
    
    // Find the matching attachment
    const requestedAttachment = attachments.find((att: any) => {
      return att.path === filePath || 
             att.path.endsWith(filePath) || 
             filePath.endsWith(att.path);
    });
    
    if (!requestedAttachment) {
      return new Response(
        JSON.stringify({ error: "Attachment not found in message" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Extract metadata from the matched attachment
    const fileName = requestedAttachment.name || filePath.split('/').pop() || 'download';
    const fileType = requestedAttachment.type || "application/octet-stream";
    
    // Determine bucket name and path
    let bucketName = "message-attachments";
    let filePathInBucket = requestedAttachment.path;
    
    // Extract bucket name if included in path
    if (filePathInBucket.includes('/')) {
      const pathParts = filePathInBucket.split('/');
      if (pathParts[0] === "message-attachments" || pathParts[0] === "message_attachments") {
        bucketName = pathParts[0];
        filePathInBucket = pathParts.slice(1).join('/');
      }
    }
    
    console.log(`[AccessFile] Downloading from ${bucketName}/${filePathInBucket}`);
    
    // Try to download the file
    try {
      const { data: fileData, error: fileError } = await supabase.storage
        .from(bucketName)
        .download(filePathInBucket);
      
      if (fileError) {
        // Try alternative bucket
        const altBucketName = bucketName === "message-attachments" ? 
                             "message_attachments" : "message-attachments";
        
        console.log(`[AccessFile] Trying alternate bucket: ${altBucketName}`);
        const { data: altFileData, error: altFileError } = await supabase.storage
          .from(altBucketName)
          .download(filePathInBucket);
          
        if (altFileError) {
          console.error(`[AccessFile] All bucket attempts failed: ${fileError.message}, ${altFileError.message}`);
          return new Response(
            JSON.stringify({ error: "File not found in storage" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return prepareFileResponse(altFileData, fileType, fileName, downloadMode);
      }
      
      return prepareFileResponse(fileData, fileType, fileName, downloadMode);
    } catch (storageError) {
      console.error(`[AccessFile] Storage error: ${storageError.message}`);
      return new Response(
        JSON.stringify({ error: "Storage access error", details: storageError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error(`[AccessFile] Unexpected error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to prepare file response
function prepareFileResponse(fileData: Blob, fileType: string, fileName: string, downloadMode: boolean): Response {
  const headers = {
    ...corsHeaders,
    "Content-Type": fileType,
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "Content-Length": fileData.size.toString()
  };
  
  const encodedFileName = encodeURIComponent(fileName);
  
  if (downloadMode) {
    headers["Content-Disposition"] = `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`;
  } else {
    headers["Content-Disposition"] = `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`;
  }
  
  console.log(`[AccessFile] Successfully sending file: ${fileName}, size: ${fileData.size} bytes`);
  return new Response(fileData, { headers });
}
