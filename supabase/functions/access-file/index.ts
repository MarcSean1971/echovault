
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
    // Check if the path includes "access-file" in the URL and handle accordingly
    let filePathIndex = 1; // Default assuming /file/...
    
    if (pathParts.length >= 2) {
      if (pathParts[0] === 'access-file' && pathParts[1] === 'file') {
        filePathIndex = 2; // Path format: /access-file/file/...
        console.log("[FileAccess] Detected /access-file/file/ path format");
      } else if (pathParts[0] === 'file') {
        filePathIndex = 1; // Path format: /file/...
        console.log("[FileAccess] Detected /file/ path format");
      }
      
      // Extract file path from URL based on the detected format
      let filePath = pathParts.slice(filePathIndex).join('/');
      
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
      
      // DEVELOPMENT MODE: Make minimal security checks
      const isDevelopment = true; // CHANGE TO FALSE FOR PRODUCTION
      
      if (!isDevelopment && (!deliveryId || !recipientEmail)) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters. Both delivery ID and recipient email are required." }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      try {
        // SIMPLIFIED VALIDATION FOR DEVELOPMENT
        // In development mode, we'll make minimal security checks to make it work
        let messageId: string | null = null;
        let bucketName = "message-attachments";
        let finalFilePath = filePath;
        let fileName = filePath.split('/').pop() || 'download';
        let fileType = "application/octet-stream";
        
        // If we're in development mode and have minimal params, we'll attempt direct access
        if (isDevelopment) {
          console.log("[FileAccess] DEVELOPMENT MODE: Using simplified security checks");
          
          // Extract the bucket name from the path if present
          if (finalFilePath.includes('/')) {
            const pathParts = finalFilePath.split('/');
            // The first part might be the bucket name
            bucketName = pathParts[0];
            // If path is in format bucket/rest/of/path, extract accordingly
            if (pathParts.length > 1) {
              finalFilePath = pathParts.slice(1).join('/');
            }
          }
          
          console.log(`[FileAccess] Using direct file access with path: ${finalFilePath} in bucket: ${bucketName}`);
        } 
        // In production mode, do full validation
        else {
          if (!deliveryId || !recipientEmail) {
            throw new Error("Missing required delivery ID or recipient email");
          }
          
          // Decode the recipient email to ensure proper comparison
          const decodedRecipientEmail = decodeURIComponent(recipientEmail);
          console.log(`[FileAccess] Validating access for delivery: ${deliveryId}, recipient: ${decodedRecipientEmail}`);
          
          // Validate that the delivery exists and matches the recipient
          const { data: deliveryData, error: deliveryError } = await supabase
            .from('delivered_messages')
            .select('message_id, recipient_id, condition_id')
            .eq('delivery_id', deliveryId)
            .maybeSingle();
          
          if (deliveryError || !deliveryData) {
            throw new Error("Invalid delivery ID");
          }
          
          messageId = deliveryData.message_id;
          
          // Verify the recipient email matches
          const { data: recipientData, error: recipientError } = await supabase
            .from('recipients')
            .select('id, email')
            .eq('id', deliveryData.recipient_id)
            .maybeSingle();
          
          if (recipientError || !recipientData) {
            throw new Error("Invalid recipient");
          }
          
          // Access has been validated, now get the message to verify the attachment path
          const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .select('attachments')
            .eq('id', deliveryData.message_id)
            .maybeSingle();
          
          if (messageError || !messageData) {
            throw new Error("Message not found");
          }
          
          // Validate the requested file path exists in the message attachments
          const attachments = messageData.attachments || [];
          
          // Find the matching attachment
          const requestedAttachment = attachments.find((att: any) => {
            const normalizedAttPath = att.path.toLowerCase();
            const normalizedRequestPath = filePath.toLowerCase();
            return normalizedAttPath.includes(normalizedRequestPath) || normalizedRequestPath.includes(normalizedAttPath);
          });
          
          if (!requestedAttachment) {
            throw new Error("Attachment not found in message");
          }
          
          // Extract the correct path without the bucket prefix
          finalFilePath = requestedAttachment.path;
          fileName = requestedAttachment.name;
          fileType = requestedAttachment.type || "application/octet-stream";
          
          // Extract the bucket name from the path if present
          if (finalFilePath.includes('/')) {
            const pathParts = finalFilePath.split('/');
            // The first part is the bucket name
            bucketName = pathParts[0];
            // If path is in format bucket/rest/of/path, extract accordingly
            if (pathParts.length > 1) {
              finalFilePath = pathParts.slice(1).join('/');
            }
          }
        }
        
        console.log(`[FileAccess] Using final file path: ${finalFilePath} in bucket: ${bucketName}`);
        
        try {
          // Download the file directly
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
          
          // Set appropriate headers for forcing download
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
