
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
  console.log(`[FileAccess] URL: ${req.url}`);
  
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
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  try {
    // Extract file path from URL if present
    if (pathParts.length >= 2 && pathParts[0] === 'file') {
      let filePath = pathParts.slice(1).join('/');
      
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
      
      console.log(`[FileAccess] Validating access for delivery: ${deliveryId}, recipient: ${recipientEmail}`);
      
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
        const requestEmail = decodeURIComponent(recipientEmail).toLowerCase();
        
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
        
        // Fix path if it doesn't include the bucket name
        if (!filePath.startsWith('message-attachments/') && !filePath.startsWith('message_attachments/')) {
          filePath = `message-attachments/${filePath}`;
          console.log(`[FileAccess] Adjusted file path to: ${filePath}`);
        }
        
        // Validate the requested file path exists in the message attachments
        const attachments = messageData.attachments || [];
        
        // Check if the attachment is in the message
        const requestedAttachment = attachments.find((att: any) => {
          // Check for exact match or match with/without bucket prefix
          return att.path === filePath || 
                 `message-attachments/${att.path}` === filePath ||
                 att.path === filePath.replace('message-attachments/', '');
        });
        
        if (!requestedAttachment) {
          console.error(`[FileAccess] Attachment not found in message attachments: ${filePath}`);
          throw new Error("Attachment not found in message");
        }
        
        console.log(`[FileAccess] Found matching attachment: ${JSON.stringify(requestedAttachment)}`);
        
        // Determine which bucket to use and extract the correct path
        let bucketName = "message-attachments";
        let finalFilePath = filePath;
        
        // Extract bucket from path if present
        if (filePath.startsWith("message-attachments/")) {
          bucketName = "message-attachments";
          finalFilePath = filePath.substring("message-attachments/".length);
        } else if (filePath.startsWith("message_attachments/")) {
          bucketName = "message_attachments";
          finalFilePath = filePath.substring("message_attachments/".length);
        }
        
        console.log(`[FileAccess] Using bucket: ${bucketName}`);
        console.log(`[FileAccess] Using file path: ${finalFilePath}`);
        
        try {
          // Get the file data directly using service role permissions
          const { data: fileData, error: fileError } = await supabase.storage
            .from(bucketName)
            .download(finalFilePath);
          
          if (fileError) {
            console.error(`[FileAccess] Storage error: ${fileError.message}`);
            
            // Try alternative bucket as fallback
            const altBucketName = bucketName === "message-attachments" ? "message_attachments" : "message-attachments";
            console.log(`[FileAccess] Trying alternative bucket: ${altBucketName}`);
            
            const altResult = await supabase.storage
              .from(altBucketName)
              .download(finalFilePath);
              
            if (altResult.error) {
              console.error(`[FileAccess] Alternative bucket also failed: ${altResult.error.message}`);
              throw new Error(`File access error: ${fileError.message}`);
            }
            
            console.log(`[FileAccess] Successfully accessed file from alternative bucket`);
            
            // Success with alternative bucket - return the file
            const headers = {
              ...corsHeaders,
              "Content-Type": requestedAttachment.type || "application/octet-stream",
              "Content-Disposition": `attachment; filename="${requestedAttachment.name}"`,
            };
            
            return new Response(altResult.data, { headers });
          }
          
          if (!fileData) {
            console.error(`[FileAccess] No file data returned from storage`);
            throw new Error("File data not available");
          }
          
          // Success - return the file with proper Content-Type
          const headers = {
            ...corsHeaders,
            "Content-Type": requestedAttachment.type || "application/octet-stream",
            "Content-Disposition": `attachment; filename="${requestedAttachment.name}"`,
          };
          
          console.log(`[FileAccess] Successfully serving file: ${filePath}`);
          
          return new Response(fileData, { headers });
          
        } catch (storageError) {
          console.error(`[FileAccess] Storage access error: ${storageError.message}`);
          
          // As a last resort, try to create a signed URL with service role permissions
          try {
            console.log(`[FileAccess] Attempting fallback to signed URL`);
            const { data: signedUrlData } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(finalFilePath, 60);
              
            if (signedUrlData?.signedUrl) {
              console.log(`[FileAccess] Successfully created signed URL: ${signedUrlData.signedUrl}`);
              
              // Redirect to the signed URL
              return new Response(null, { 
                status: 302, 
                headers: { 
                  ...corsHeaders, 
                  "Location": signedUrlData.signedUrl 
                }
              });
            }
          } catch (signedUrlError) {
            console.error(`[FileAccess] Signed URL fallback failed: ${signedUrlError}`);
          }
          
          throw storageError;
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
