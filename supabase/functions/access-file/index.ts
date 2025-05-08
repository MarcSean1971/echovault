
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./cors-headers.ts";
import { createSupabaseClient } from "./supabase-client.ts";

console.log("[AccessFile] Function starting up");

serve(async (req: Request): Promise<Response> => {
  // Enhanced logging to track requests
  console.log("[AccessFile] ==== New request received ====");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("[AccessFile] Handling OPTIONS preflight request");
    return new Response(null, { 
      headers: corsHeaders 
    });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  console.log(`[AccessFile] Request details: ${req.method} ${url.pathname}`);
  console.log(`[AccessFile] Full URL: ${req.url}`);
  console.log(`[AccessFile] Path parts: ${JSON.stringify(pathParts)}`);
  console.log(`[AccessFile] Query parameters: ${url.search}`);
  
  // Check for download mode from various parameter names
  const downloadMode = 
    url.searchParams.get('download-file') === 'true' || 
    url.searchParams.get('mode') === 'download' ||
    url.searchParams.has('forceDownload');
  
  console.log(`[AccessFile] Download mode: ${downloadMode ? 'true' : 'false'}`);
  
  try {
    // Get environment variables - enhanced with additional error checking
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Log environment status (without exposing secrets)
    console.log(`[AccessFile] Environment check:`);
    console.log(`[AccessFile] SUPABASE_URL available: ${supabaseUrl ? 'Yes' : 'No'}`);
    console.log(`[AccessFile] SUPABASE_SERVICE_ROLE_KEY available: ${supabaseServiceRoleKey ? 'Yes' : 'No'}`);

    // Error if environment variables are missing
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[AccessFile] CRITICAL ERROR: Missing required environment variables');
      
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error", 
          details: "Missing required environment variables",
          env_status: {
            url_present: !!supabaseUrl,
            key_present: !!supabaseServiceRoleKey
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Create Supabase client using our dedicated client
    const supabase = createSupabaseClient();
    console.log(`[AccessFile] Supabase client created successfully`);
    
    // Extract file path from URL based on the detected pattern
    let filePath = '';
    let filePathIndex = 0;
    
    // Handle different path patterns
    if (pathParts.length >= 2) {
      if (pathParts[0] === 'access-file' && pathParts[1] === 'file') {
        // Pattern: /access-file/file/{path}
        filePathIndex = 2;
        console.log("[AccessFile] Detected /access-file/file/ path format");
      } else if (pathParts[0] === 'file') {
        // Pattern: /file/{path}
        filePathIndex = 1;
        console.log("[AccessFile] Detected /file/ path format");
      } else if (pathParts[0] === 'v1' && pathParts[1] === 'access-file') {
        // Pattern: /v1/access-file/file/{path}
        filePathIndex = pathParts.indexOf('file') + 1;
        console.log("[AccessFile] Detected /v1/access-file/file/ path format");
      }
      
      // Extract file path
      if (filePathIndex > 0 && filePathIndex < pathParts.length) {
        filePath = pathParts.slice(filePathIndex).join('/');
        
        // Properly decode the URL-encoded path
        try {
          filePath = decodeURIComponent(filePath);
          console.log(`[AccessFile] Decoded file path: ${filePath}`);
        } catch (decodeError) {
          console.error(`[AccessFile] Error decoding file path: ${decodeError.message}`);
          // Continue with the encoded path as fallback
        }
        
        console.log(`[AccessFile] Requested file path: ${filePath}`);
        
        // Get query parameters for security validation
        const deliveryId = url.searchParams.get('delivery');
        const recipientEmail = url.searchParams.get('recipient');
        
        console.log(`[AccessFile] Security parameters: delivery=${deliveryId}, recipient=${recipientEmail}`);
        
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
          
          console.log(`[AccessFile] Starting security validation for delivery=${deliveryId}, recipient=${recipientEmail}`);
          
          // Test Supabase connection with a simple query first
          const { data: connectionTest, error: connectionError } = await supabase
            .from('delivered_messages')
            .select('count(*)', { count: 'exact', head: true });
            
          console.log(`[AccessFile] Connection test: ${connectionError ? 'Failed' : 'Successful'}`);
          
          if (connectionError) {
            console.error(`[AccessFile] Connection test error: ${connectionError.message}`);
            console.error(`[AccessFile] Error code: ${connectionError.code}`);
            console.error(`[AccessFile] Error details: ${JSON.stringify(connectionError.details || {})}`);
            
            throw new Error(`Database connection failed: ${connectionError.message}`);
          }

          // Validate delivery and recipient using the supabase client
          console.log("[AccessFile] Validating delivery record...");
          const { data: deliveryData, error: deliveryError } = await supabase
            .from('delivered_messages')
            .select('message_id, recipient_id, condition_id')
            .eq('delivery_id', deliveryId)
            .maybeSingle();
          
          if (deliveryError) {
            console.error(`[AccessFile] Error fetching delivery: ${deliveryError.message}`, deliveryError);
            console.error(`[AccessFile] Error code: ${deliveryError.code}`);
            console.error(`[AccessFile] Error details: ${JSON.stringify(deliveryError.details || {})}`);
            throw new Error(`Invalid delivery ID: ${deliveryError.message}`);
          }
          
          if (!deliveryData) {
            console.error(`[AccessFile] Delivery ID not found: ${deliveryId}`);
            throw new Error(`Delivery ID not found: ${deliveryId}`);
          }
          
          console.log(`[AccessFile] Found delivery data: ${JSON.stringify(deliveryData)}`);
          
          messageId = deliveryData.message_id;
          
          // Verify the recipient email matches
          console.log("[AccessFile] Validating recipient...");
          const { data: recipientData, error: recipientError } = await supabase
            .from('recipients')
            .select('id, email')
            .eq('id', deliveryData.recipient_id)
            .maybeSingle();
          
          if (recipientError) {
            console.error(`[AccessFile] Error fetching recipient: ${recipientError.message}`, recipientError);
            throw new Error(`Invalid recipient: ${recipientError.message}`);
          }
          
          if (!recipientData) {
            console.error(`[AccessFile] Recipient not found: ${deliveryData.recipient_id}`);
            throw new Error(`Recipient not found`);
          }
          
          console.log(`[AccessFile] Found recipient data: ${JSON.stringify(recipientData)}`);
          console.log(`[AccessFile] Comparing emails - DB: '${recipientData.email}', Request: '${recipientEmail}'`);
          
          // Case insensitive comparison of emails
          if (recipientData.email.toLowerCase() !== recipientEmail.toLowerCase()) {
            console.error(`[AccessFile] Email mismatch: DB=${recipientData.email}, Request=${recipientEmail}`);
            throw new Error("Recipient email does not match");
          }
          
          console.log(`[AccessFile] Email verification successful`);
          
          // Access has been validated, now get the message to verify the attachment path
          console.log("[AccessFile] Retrieving message data...");
          const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .select('attachments')
            .eq('id', deliveryData.message_id)
            .maybeSingle();
          
          if (messageError) {
            console.error(`[AccessFile] Error fetching message: ${messageError.message}`, messageError);
            throw new Error(`Message not found: ${messageError.message}`);
          }
          
          if (!messageData) {
            console.error(`[AccessFile] Message not found: ${deliveryData.message_id}`);
            throw new Error(`Message not found`);
          }
          
          // Validate the requested file path exists in the message attachments
          const attachments = messageData.attachments || [];
          console.log(`[AccessFile] Message attachments: ${JSON.stringify(attachments)}`);
          
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
            console.error(`[AccessFile] Attachment not found in message. Requested: ${filePath}`);
            console.error(`[AccessFile] Available attachments: ${JSON.stringify(attachments.map((a: any) => a.path))}`);
            throw new Error("Attachment not found in message");
          }
          
          console.log(`[AccessFile] Found matching attachment: ${JSON.stringify(requestedAttachment)}`);
          
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
          
          console.log(`[AccessFile] Using final file path: ${finalFilePath} in bucket: ${bucketName}`);
          
          try {
            // Download the file from storage
            console.log(`[AccessFile] Downloading from bucket: ${bucketName}, path: ${finalFilePath}`);
            const { data: fileData, error: fileError } = await supabase.storage
              .from(bucketName)
              .download(finalFilePath);
              
            if (fileError) {
              console.error(`[AccessFile] File download error: ${fileError.message}`, fileError);
              console.error(`[AccessFile] Error code: ${fileError.code}`);
              console.error(`[AccessFile] Error details: ${JSON.stringify(fileError.details || {})}`);
              throw fileError;
            }
            
            if (!fileData) {
              console.error(`[AccessFile] No file data returned from download`);
              throw new Error("File data not available");
            }
            
            console.log(`[AccessFile] File downloaded successfully, size: ${fileData.size} bytes`);
            
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
              console.log(`[AccessFile] FORCING DOWNLOAD with headers: ${JSON.stringify(headers)}`);
            } else {
              // Default to inline disposition for viewing
              headers["Content-Disposition"] = `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`;
              console.log(`[AccessFile] INLINE VIEWING with headers: ${JSON.stringify(headers)}`);
            }
            
            // Return the file with appropriate headers
            console.log(`[AccessFile] Successfully sending file response with ${Object.keys(headers).length} headers`);
            return new Response(fileData, { headers });
          } catch (storageError: any) {
            console.error(`[AccessFile] Storage access error: ${storageError.message}`, storageError);
            console.error(`[AccessFile] Error stack: ${storageError.stack || 'No stack trace'}`);
            
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
          console.error(`[AccessFile] Validation error: ${validationError.message}`, validationError);
          console.error(`[AccessFile] Error stack: ${validationError.stack || 'No stack trace'}`);
          
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
    console.error(`[AccessFile] No matching route found for path: ${url.pathname}`);
    return new Response(
      JSON.stringify({ error: "Not found", path: url.pathname }),
      { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error(`[AccessFile] Unhandled error: ${error.message}`);
    console.error(error.stack || "No stack trace available");
    
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
