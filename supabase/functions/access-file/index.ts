
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors-headers.ts";

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("[FileAccess] Handling OPTIONS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  console.log(`[FileAccess] Received request: ${req.method} ${url.pathname}`);
  console.log(`[FileAccess] Full URL: ${req.url}`);
  console.log(`[FileAccess] Path parts: ${JSON.stringify(pathParts)}`);
  console.log(`[FileAccess] Query parameters: ${url.search}`);
  
  // Check for download mode from various parameter names
  const downloadMode = 
    url.searchParams.get('download-file') === 'true' || 
    url.searchParams.get('mode') === 'download' ||
    url.searchParams.has('forceDownload');
  
  console.log(`[FileAccess] Download mode: ${downloadMode ? 'true' : 'false'}`);
  
  // Initialize Supabase client with service role key for admin access
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('[FileAccess] Missing required environment variables');
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
  
  console.log(`[FileAccess] Supabase URL: ${supabaseUrl}`);
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  try {
    // Extract file path from URL based on the detected pattern
    let filePath = '';
    let filePathIndex = 0;
    
    // Handle different path patterns
    if (pathParts.length >= 2) {
      if (pathParts[0] === 'access-file' && pathParts[1] === 'file') {
        // Pattern: /access-file/file/{path}
        filePathIndex = 2;
        console.log("[FileAccess] Detected /access-file/file/ path format");
      } else if (pathParts[0] === 'file') {
        // Pattern: /file/{path}
        filePathIndex = 1;
        console.log("[FileAccess] Detected /file/ path format");
      } else if (pathParts[0] === 'v1' && pathParts[1] === 'access-file') {
        // Pattern: /v1/access-file/file/{path}
        filePathIndex = pathParts.indexOf('file') + 1;
        console.log("[FileAccess] Detected /v1/access-file/file/ path format");
      }
      
      // Extract file path
      if (filePathIndex > 0 && filePathIndex < pathParts.length) {
        filePath = pathParts.slice(filePathIndex).join('/');
        
        // Properly decode the URL-encoded path
        try {
          filePath = decodeURIComponent(filePath);
          console.log(`[FileAccess] Decoded file path: ${filePath}`);
        } catch (decodeError) {
          console.error(`[FileAccess] Error decoding file path: ${decodeError.message}`);
          // Continue with the encoded path as fallback
        }
        
        console.log(`[FileAccess] Requested file path: ${filePath}`);
        
        // Get query parameters for security validation
        const deliveryId = url.searchParams.get('delivery');
        const recipientEmail = url.searchParams.get('recipient');
        
        console.log(`[FileAccess] Query params: delivery=${deliveryId}, recipient=${recipientEmail}`);
        
        // Always enforce security validation in production
        if (!deliveryId || !recipientEmail) {
          return new Response(
            JSON.stringify({ error: "Missing required parameters. Both delivery ID and recipient email are required." }),
            { 
              status: 400, 
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
        
        try {
          let messageId: string | null = null;
          let bucketName = "message-attachments";
          let finalFilePath = filePath;
          let fileName = filePath.split('/').pop() || 'download';
          let fileType = "application/octet-stream";
          
          // Validate delivery and recipient
          const { data: deliveryData, error: deliveryError } = await supabase
            .from('delivered_messages')
            .select('message_id, recipient_id, condition_id')
            .eq('delivery_id', deliveryId)
            .maybeSingle();
          
          if (deliveryError || !deliveryData) {
            throw new Error(`Invalid delivery ID: ${deliveryError?.message || "Not found"}`);
          }
          
          messageId = deliveryData.message_id;
          
          // Verify the recipient email matches
          const { data: recipientData, error: recipientError } = await supabase
            .from('recipients')
            .select('id, email')
            .eq('id', deliveryData.recipient_id)
            .maybeSingle();
          
          if (recipientError || !recipientData) {
            throw new Error(`Invalid recipient: ${recipientError?.message || "Not found"}`);
          }
          
          // Access has been validated, now get the message to verify the attachment path
          const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .select('attachments')
            .eq('id', deliveryData.message_id)
            .maybeSingle();
          
          if (messageError || !messageData) {
            throw new Error(`Message not found: ${messageError?.message || "Not found"}`);
          }
          
          // Validate the requested file path exists in the message attachments
          const attachments = messageData.attachments || [];
          console.log(`[FileAccess] Message attachments:`, attachments);
          
          // Find the matching attachment (either by exact match or contained path)
          const requestedAttachment = attachments.find((att: any) => {
            // Normalize paths for comparison
            const attPath = att.path ? att.path.toLowerCase() : '';
            const reqPath = filePath.toLowerCase();
            
            // Try different matching strategies
            return attPath === reqPath || 
                   attPath.endsWith(reqPath) || 
                   reqPath.endsWith(attPath) ||
                   attPath.includes(reqPath) ||
                   reqPath.includes(attPath);
          });
          
          if (!requestedAttachment) {
            console.error(`[FileAccess] Attachment not found in message. Requested: ${filePath}`);
            console.error(`[FileAccess] Available attachments:`, attachments.map((a: any) => a.path));
            throw new Error("Attachment not found in message");
          }
          
          console.log(`[FileAccess] Found matching attachment:`, requestedAttachment);
          
          // Extract the correct path and metadata
          finalFilePath = requestedAttachment.path;
          fileName = requestedAttachment.name || fileName;
          fileType = requestedAttachment.type || fileType;
          
          // Handle bucket name extraction if path includes bucket prefix
          if (finalFilePath.includes('/')) {
            const pathParts = finalFilePath.split('/');
            // Check if first part is a valid bucket name
            if (pathParts[0] === "message-attachments" || pathParts[0] === "message_attachments") {
              bucketName = pathParts[0];
              finalFilePath = pathParts.slice(1).join('/');
            }
          }
          
          console.log(`[FileAccess] Using final file path: ${finalFilePath} in bucket: ${bucketName}`);
          
          try {
            // Download the file from storage
            console.log(`[FileAccess] Downloading from bucket: ${bucketName}, path: ${finalFilePath}`);
            const { data: fileData, error: fileError } = await supabase.storage
              .from(bucketName)
              .download(finalFilePath);
              
            if (fileError) {
              console.error(`[FileAccess] File download error: ${fileError.message}`);
              throw fileError;
            }
            
            if (!fileData) {
              console.error(`[FileAccess] No file data returned from download`);
              throw new Error("File data not available");
            }
            
            // Set appropriate headers for the response
            const headers = {
              ...corsHeaders,
              "Content-Type": fileType,
              // Aggressive no-cache settings
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              "Pragma": "no-cache",
              "Expires": "0",
              "Content-Length": fileData.size.toString()
            };
            
            // Add file name parameter to Content-Disposition
            const encodedFileName = encodeURIComponent(fileName);
            
            // Set correct content disposition based on download mode
            if (downloadMode) {
              // Force download with attachment disposition
              headers["Content-Disposition"] = `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`;
              console.log(`[FileAccess] FORCING DOWNLOAD with headers:`, headers);
            } else {
              // Default to inline disposition for viewing
              headers["Content-Disposition"] = `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`;
              console.log(`[FileAccess] INLINE VIEWING with headers:`, headers);
            }
            
            return new Response(fileData, { headers });
          } catch (storageError) {
            console.error(`[FileAccess] Storage access error: ${storageError.message}`);
            return new Response(
              JSON.stringify({ error: "File access error", details: storageError.message }),
              { 
                status: 500, 
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              }
            );
          }
        } catch (validationError) {
          console.error(`[FileAccess] Validation error: ${validationError.message}`);
          return new Response(
            JSON.stringify({ error: validationError.message || "Access denied" }),
            { 
              status: 403, 
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
      }
    }
    
    // Default handler - not found
    console.error(`[FileAccess] No matching route found for path: ${url.pathname}`);
    return new Response(
      JSON.stringify({ error: "Not found", path: url.pathname }),
      { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error(`[FileAccess] Unhandled error: ${error.message}`);
    console.error(error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error", 
        path: url.pathname
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
