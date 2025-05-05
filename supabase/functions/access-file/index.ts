
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
    // This is to ensure compatibility with both URL formats
    // Our client might be calling with /access-file/file/... or /file/...
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
      
      if (!deliveryId || !recipientEmail) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters. Both delivery ID and recipient email are required." }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // Decode the recipient email to ensure proper comparison
      const decodedRecipientEmail = decodeURIComponent(recipientEmail);
      console.log(`[FileAccess] Validating access for delivery: ${deliveryId}, recipient: ${decodedRecipientEmail}`);
      
      try {
        // Validate that the delivery exists and matches the recipient
        const { data: deliveryData, error: deliveryError } = await supabase
          .from('delivered_messages')
          .select('message_id, recipient_id, condition_id')
          .eq('delivery_id', deliveryId)
          .maybeSingle();
        
        if (deliveryError) {
          console.error(`[FileAccess] Database error checking delivery: ${deliveryError.message}`);
          throw new Error(`Invalid delivery: ${deliveryError.message}`);
        }
        
        if (!deliveryData) {
          console.error(`[FileAccess] No delivery found with ID: ${deliveryId}`);
          throw new Error("Invalid delivery ID");
        }
        
        console.log(`[FileAccess] Found delivery record: ${JSON.stringify(deliveryData)}`);
        
        // Verify the recipient email matches
        const { data: recipientData, error: recipientError } = await supabase
          .from('recipients')
          .select('id, email')
          .eq('id', deliveryData.recipient_id)
          .maybeSingle();
        
        if (recipientError) {
          console.error(`[FileAccess] Database error checking recipient: ${recipientError.message}`);
          throw new Error(`Invalid recipient: ${recipientError.message}`);
        }
        
        if (!recipientData) {
          console.error(`[FileAccess] No recipient found with ID: ${deliveryData.recipient_id}`);
          throw new Error("Invalid recipient");
        }
        
        console.log(`[FileAccess] Found recipient record: ${JSON.stringify(recipientData)}`);
        
        // Compare emails with case-insensitive matching
        const dbEmail = recipientData.email.toLowerCase();
        const requestEmail = decodedRecipientEmail.toLowerCase();
        
        console.log(`[FileAccess] Comparing emails - DB: '${dbEmail}', Request: '${requestEmail}'`);
        
        if (dbEmail !== requestEmail) {
          console.error(`[FileAccess] Email mismatch: DB=${dbEmail}, Request=${requestEmail}`);
          throw new Error("Email verification failed");
        }
        
        console.log('[FileAccess] Email verification successful');
        
        // Access has been validated, now get the message to verify the attachment path
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .select('attachments')
          .eq('id', deliveryData.message_id)
          .maybeSingle();
        
        if (messageError) {
          console.error(`[FileAccess] Database error checking message: ${messageError.message}`);
          throw new Error(`Message error: ${messageError.message}`);
        }

        if (!messageData) {
          console.error(`[FileAccess] Message not found with ID: ${deliveryData.message_id}`);
          throw new Error("Message not found");
        }
        
        console.log(`[FileAccess] Found message with attachments: ${JSON.stringify(messageData.attachments || [])}`);
        
        // Standardize bucket name to message-attachments
        const bucketName = "message-attachments";
        
        // Fix path if it doesn't include the bucket name
        let normalizedFilePath = filePath;
        if (!normalizedFilePath.startsWith('message-attachments/') && !normalizedFilePath.startsWith('message_attachments/')) {
          normalizedFilePath = `${bucketName}/${normalizedFilePath}`;
          console.log(`[FileAccess] Adjusted file path to: ${normalizedFilePath}`);
        }
        
        // Validate the requested file path exists in the message attachments
        const attachments = messageData.attachments || [];
        
        // Function to normalize paths for comparison
        const normalizePath = (path: string): string => {
          // Remove bucket prefix if present
          let normalized = path;
          if (normalized.startsWith(bucketName + '/')) {
            normalized = normalized.substring(bucketName.length + 1);
          } else if (normalized.startsWith('message_attachments/')) {
            normalized = normalized.substring('message_attachments/'.length);
          }
          
          // Replace URL-encoded characters with their actual values
          try {
            normalized = decodeURIComponent(normalized);
          } catch (e) {
            // If decoding fails, continue with the path as-is
          }
          
          return normalized.toLowerCase();
        };
        
        // Get the normalized requested path
        const normalizedRequestPath = normalizePath(normalizedFilePath);
        console.log(`[FileAccess] Normalized request path for comparison: '${normalizedRequestPath}'`);
        
        // Check if the attachment is in the message
        const requestedAttachment = attachments.find((att: any) => {
          const normalizedAttPath = normalizePath(att.path);
          console.log(`[FileAccess] Comparing normalized paths: '${normalizedAttPath}' vs '${normalizedRequestPath}'`);
          return normalizedAttPath === normalizedRequestPath;
        });
        
        if (!requestedAttachment) {
          console.error(`[FileAccess] Attachment not found in message attachments: ${filePath}`);
          console.error(`[FileAccess] Available attachments: ${JSON.stringify(attachments)}`);
          throw new Error("Attachment not found in message");
        }
        
        console.log(`[FileAccess] Found matching attachment: ${JSON.stringify(requestedAttachment)}`);
        
        // Extract the correct path without the bucket prefix
        let finalFilePath = requestedAttachment.path;
        if (finalFilePath.startsWith(`${bucketName}/`)) {
          finalFilePath = finalFilePath.substring(bucketName.length + 1);
        } else if (finalFilePath.startsWith('message_attachments/')) {
          finalFilePath = finalFilePath.substring('message_attachments/'.length);
        }
        
        console.log(`[FileAccess] Using final file path: ${finalFilePath}`);
        
        try {
          // Check if we can directly serve from the storage bucket using signed URL
          console.log(`[FileAccess] Attempting to generate direct signed URL from ${bucketName}/${finalFilePath}`);
          
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(finalFilePath, 60);
            
          if (signedUrlError) {
            console.error(`[FileAccess] Error creating signed URL: ${signedUrlError.message}`);
            throw signedUrlError;
          }
          
          if (signedUrlData?.signedUrl) {
            console.log(`[FileAccess] Successfully created signed URL: ${signedUrlData.signedUrl}`);
            
            // Redirect to the signed URL
            return new Response(null, { 
              status: 302, 
              headers: { 
                ...corsHeaders, 
                "Location": signedUrlData.signedUrl,
                "Cache-Control": "no-cache" 
              }
            });
          }
          
          throw new Error("No signed URL was generated");
          
        } catch (storageError) {
          console.error(`[FileAccess] Storage access error: ${storageError.message}`);
          
          // Try to serve the file directly as a last resort
          try {
            console.log(`[FileAccess] Attempting to download file directly`);
            
            const { data: fileData, error: fileError } = await supabase.storage
              .from(bucketName)
              .download(finalFilePath);
              
            if (fileError) {
              console.error(`[FileAccess] Download error: ${fileError.message}`);
              throw fileError;
            }
            
            if (!fileData) {
              console.error(`[FileAccess] No file data returned from download`);
              throw new Error("File data not available");
            }
            
            // Success - return the file with proper Content-Type
            const headers = {
              ...corsHeaders,
              "Content-Type": requestedAttachment.type || "application/octet-stream",
              "Content-Disposition": `attachment; filename="${requestedAttachment.name}"`,
              "Cache-Control": "no-store"
            };
            
            console.log(`[FileAccess] Successfully serving file as direct download: ${finalFilePath}`);
            
            return new Response(fileData, { headers });
          } catch (downloadError) {
            console.error(`[FileAccess] Direct download failed: ${downloadError.message}`);
            throw downloadError;
          }
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
