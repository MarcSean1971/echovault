
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createSupabaseClient } from "./supabase-client.ts";

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("[AccessFile] Starting simplified file access function with hardcoded authentication");

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
        
        if (!filePath) {
          return new Response(
            JSON.stringify({ error: "Missing file path in request body" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // If we have delivery context, use it
        if (delivery && recipient) {
          // Return URL for client to use
          return new Response(
            JSON.stringify({ 
              url: `https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/access-file/file/${encodeURIComponent(filePath)}?delivery=${encodeURIComponent(delivery)}&recipient=${encodeURIComponent(recipient)}&mode=${mode || 'view'}&download-file=${!!download}` 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // Handle authenticated direct access - no delivery context
          const authHeader = req.headers.get('Authorization');
          if (!authHeader) {
            console.log("[AccessFile] No auth header present, checking auth_token param");
            // Check for auth token in parameters
            const authToken = url.searchParams.get('auth_token');
            if (!authToken) {
              // No authentication available for direct access
              return new Response(
                JSON.stringify({ error: "Authentication required for direct file access" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
          
          console.log("[AccessFile] Authenticated direct access request");
          
          // Create Supabase client with auth header for direct file access
          const supabase = createSupabaseClient(authHeader);
          
          // Extract bucket name and path
          let bucketName = "message-attachments";
          let filePathInBucket = filePath;
          
          // Extract bucket name if included in path
          if (filePathInBucket.includes('/')) {
            const pathParts = filePathInBucket.split('/');
            if (pathParts[0] === "message-attachments" || pathParts[0] === "message_attachments") {
              bucketName = pathParts[0];
              filePathInBucket = pathParts.slice(1).join('/');
            }
          }
          
          try {
            const { data: fileData, error: fileError } = await supabase.storage
              .from(bucketName)
              .download(filePathInBucket);
            
            if (fileError) {
              // Try alternative bucket
              const altBucketName = bucketName === "message-attachments" ? 
                                  "message_attachments" : "message-attachments";
              
              const { data: altFileData, error: altFileError } = await supabase.storage
                .from(altBucketName)
                .download(filePathInBucket);
                
              if (altFileError) {
                return new Response(
                  JSON.stringify({ error: "File not found in storage" }),
                  { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
              
              const fileName = filePath.split('/').pop() || 'download';
              const fileType = "application/octet-stream";
              return prepareFileResponse(altFileData, fileType, fileName, download || false);
            }
            
            const fileName = filePath.split('/').pop() || 'download';
            const fileType = "application/octet-stream";
            return prepareFileResponse(fileData, fileType, fileName, download || false);
          } catch (error) {
            return new Response(
              JSON.stringify({ error: "Error accessing file", details: error.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
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
    let authHeader = req.headers.get('Authorization');
    const authParamToken = url.searchParams.get('auth_token');
    
    console.log(`[AccessFile] File: ${filePath}, Delivery: ${deliveryId || 'none'}, Download: ${downloadMode}`);
    console.log(`[AccessFile] Auth Header: ${authHeader ? 'Present' : 'Missing'}, Auth Param: ${authParamToken ? 'Present' : 'Missing'}`);
    console.log(`[AccessFile] NOTICE: Using service role key for authentication regardless of auth token`);
    
    // For delivery-based access, validate parameters
    if (deliveryId && recipientEmail) {
      console.log("[AccessFile] Processing delivery-based access request");
      
      // Create Supabase client with service role key (ignoring auth token)
      const supabase = createSupabaseClient(authHeader);
      
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
      
      // Process the file download
      return await handleFileDownload(supabase, filePath, fileName, fileType, downloadMode);
    } 
    // For authenticated direct access (no delivery context)
    else if (authHeader || authParamToken) {
      console.log("[AccessFile] Processing authenticated direct access request");
      
      // Create Supabase client with auth from header or param
      const effectiveAuth = authHeader || `Bearer ${authParamToken}`;
      const supabase = createSupabaseClient(effectiveAuth);
      
      // Get basic file information from path
      const fileName = filePath.split('/').pop() || 'download';
      const fileType = "application/octet-stream"; // Default type, would be better if provided
      
      // Process the file download
      return await handleFileDownload(supabase, filePath, fileName, fileType, downloadMode);
    } 
    else {
      // No authentication or delivery context provided
      return new Response(
        JSON.stringify({ error: "Missing required parameters (delivery ID and recipient, or authentication)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

// Helper function to handle file downloads
async function handleFileDownload(
  supabase: any, 
  filePath: string, 
  fileName: string, 
  fileType: string, 
  downloadMode: boolean
): Promise<Response> {
  // Determine bucket name and path
  let bucketName = "message-attachments";
  let filePathInBucket = filePath;
  
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
          { status: 404, headers: { corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return prepareFileResponse(altFileData, fileType, fileName, downloadMode);
    }
    
    return prepareFileResponse(fileData, fileType, fileName, downloadMode);
  } catch (storageError) {
    console.error(`[AccessFile] Storage error: ${storageError.message}`);
    return new Response(
      JSON.stringify({ error: "Storage access error", details: storageError.message }),
      { status: 500, headers: { corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

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
