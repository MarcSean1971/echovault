
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
  // Get from environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  console.log(`[FileAccess] Initializing Supabase client with URL: ${supabaseUrl}`);
  console.log(`[FileAccess] Service role key available: ${supabaseServiceRoleKey ? 'Yes' : 'No'}`);
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('[FileAccess] Missing required environment variables');
    return new Response(
      JSON.stringify({ error: "Server configuration error", details: "Missing required environment variables" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
  
  console.log(`[FileAccess] Supabase URL: ${supabaseUrl}`);
  
  try {
    // Create the Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log(`[FileAccess] Supabase client created successfully`);
    
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
        
        // Always enforce security validation for production
        if (!deliveryId || !recipientEmail) {
          return new Response(
            JSON.stringify({ 
              error: "Missing required parameters. Both delivery ID and recipient email are required.",
              details: {
                path: url.pathname,
                params: {
                  delivery: deliveryId ? 'present' : 'missing',
                  recipient: recipientEmail ? 'present' : 'missing'
                }
              }
            }),
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
          
          console.log(`[FileAccess] Starting security validation for delivery=${deliveryId}, recipient=${recipientEmail}`);
          
          // Validate delivery and recipient using the service role client
          const { data: deliveryData, error: deliveryError } = await supabase
            .from('delivered_messages')
            .select('message_id, recipient_id, condition_id')
            .eq('delivery_id', deliveryId)
            .maybeSingle();
          
          if (deliveryError) {
            console.error(`[FileAccess] Error fetching delivery: ${deliveryError.message}`, deliveryError);
            throw new Error(`Invalid delivery ID: ${deliveryError.message}`);
          }
          
          if (!deliveryData) {
            console.error(`[FileAccess] Delivery ID not found: ${deliveryId}`);
            throw new Error(`Delivery ID not found: ${deliveryId}`);
          }
          
          console.log(`[FileAccess] Found delivery data:`, deliveryData);
          
          messageId = deliveryData.message_id;
          
          // Verify the recipient email matches
          const { data: recipientData, error: recipientError } = await supabase
            .from('recipients')
            .select('id, email')
            .eq('id', deliveryData.recipient_id)
            .maybeSingle();
          
          if (recipientError) {
            console.error(`[FileAccess] Error fetching recipient: ${recipientError.message}`, recipientError);
            throw new Error(`Invalid recipient: ${recipientError.message}`);
          }
          
          if (!recipientData) {
            console.error(`[FileAccess] Recipient not found: ${deliveryData.recipient_id}`);
            throw new Error(`Recipient not found`);
          }
          
          console.log(`[FileAccess] Found recipient data:`, recipientData);
          console.log(`[FileAccess] Comparing emails - DB: '${recipientData.email}', Request: '${recipientEmail}'`);
          
          // Case insensitive comparison of emails
          if (recipientData.email.toLowerCase() !== recipientEmail.toLowerCase()) {
            console.error(`[FileAccess] Email mismatch: DB=${recipientData.email}, Request=${recipientEmail}`);
            throw new Error("Recipient email does not match");
          }
          
          console.log(`[FileAccess] Email verification successful`);
          
          // Access has been validated, now get the message to verify the attachment path
          const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .select('attachments')
            .eq('id', deliveryData.message_id)
            .maybeSingle();
          
          if (messageError) {
            console.error(`[FileAccess] Error fetching message: ${messageError.message}`, messageError);
            throw new Error(`Message not found: ${messageError.message}`);
          }
          
          if (!messageData) {
            console.error(`[FileAccess] Message not found: ${deliveryData.message_id}`);
            throw new Error(`Message not found`);
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
              console.error(`[FileAccess] File download error: ${fileError.message}`, fileError);
              throw fileError;
            }
            
            if (!fileData) {
              console.error(`[FileAccess] No file data returned from download`);
              throw new Error("File data not available");
            }
            
            console.log(`[FileAccess] File downloaded successfully, size: ${fileData.size} bytes`);
            
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
            
            // Return the file with appropriate headers
            console.log(`[FileAccess] Successfully sending file response with ${Object.keys(headers).length} headers`);
            return new Response(fileData, { headers });
          } catch (storageError: any) {
            console.error(`[FileAccess] Storage access error: ${storageError.message}`, storageError);
            return new Response(
              JSON.stringify({ 
                error: "File access error", 
                details: storageError.message,
                path: finalFilePath,
                bucket: bucketName
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              }
            );
          }
        } catch (validationError: any) {
          console.error(`[FileAccess] Validation error: ${validationError.message}`, validationError);
          return new Response(
            JSON.stringify({ 
              error: validationError.message || "Access denied",
              details: {
                path: url.pathname,
                delivery: deliveryId,
                recipientPartial: recipientEmail ? recipientEmail.substring(0, 3) + '...' : 'missing'
              }
            }),
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
  } catch (error: any) {
    console.error(`[FileAccess] Unhandled error: ${error.message}`);
    console.error(error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error", 
        path: url.pathname,
        stack: error.stack || "No stack trace available"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
