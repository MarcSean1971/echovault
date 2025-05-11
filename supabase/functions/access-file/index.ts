
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createSupabaseClient } from "./supabase-client.ts";
import { corsHeaders } from "./cors-headers.ts";

console.log("[AccessFile] Starting simplified file access function with improved validation");

// Helper function to normalize file paths
function normalizeFilePath(path: string): string {
  // Remove 'file/' prefix if present
  if (path.startsWith('file/')) {
    return path.substring(5);
  }
  return path;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract path and search parameters from URL
  const url = new URL(req.url);
  const path = url.pathname.split('/').filter(Boolean);
  
  console.log(`[AccessFile] Request path: ${url.pathname}`);
  console.log(`[AccessFile] Search params: ${url.search}`);
  
  try {
    // Option 1: Parse JSON body for direct invocation via supabase.functions.invoke
    let filePath, deliveryId, recipientEmail, downloadMode, debugMode;
    
    if (req.method === 'POST') {
      try {
        const bodyJson = await req.json();
        filePath = bodyJson.filePath;
        deliveryId = bodyJson.delivery;
        recipientEmail = bodyJson.recipient;
        downloadMode = bodyJson.download === true || bodyJson.mode === 'download';
        debugMode = bodyJson.debug === true;
        
        console.log(`[AccessFile] POST params - File: ${filePath}, Delivery: ${deliveryId}, Recipient: ${recipientEmail?.substring(0, 5)}...`);
      } catch (parseError) {
        console.error("[AccessFile] Error parsing request body:", parseError);
      }
    } 
    // Option 2: Parse URL path and search parameters for direct URL access
    else if (path.length >= 2 && path[0] === 'access-file') {
      filePath = decodeURIComponent(path.slice(1).join('/'));
      deliveryId = url.searchParams.get('delivery');
      recipientEmail = url.searchParams.get('recipient');
      downloadMode = url.searchParams.get('download-file') === 'true' || 
                    url.searchParams.get('mode') === 'download';
      debugMode = url.searchParams.get('debug') === 'true';
      
      console.log(`[AccessFile] GET params - File: ${filePath}, Delivery: ${deliveryId}, Download: ${downloadMode}, Debug: ${debugMode}`);
    }

    // Validate required parameters
    if (!filePath) {
      return new Response(
        JSON.stringify({ error: "Missing file path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Normalize file path by removing 'file/' prefix if present
    const normalizedFilePath = normalizeFilePath(filePath);
    console.log(`[AccessFile] Normalized file path: ${normalizedFilePath} (original: ${filePath})`);
    
    // Check for authentication token
    const authHeader = req.headers.get('Authorization');
    const authParam = url.searchParams.get('auth_token');
    const apiKey = url.searchParams.get('apikey');
    
    console.log(`[AccessFile] Auth Header: ${authHeader ? 'Present' : 'Missing'}, Auth Param: ${authParam ? 'Present' : 'Missing'}`);
    
    // Determine access type based on presence of delivery ID and recipient email
    if (deliveryId && recipientEmail) {
      console.log(`[AccessFile] Processing delivery-based access request`);
      console.log(`[AccessFile] Delivery ID exact value: '${deliveryId}'`);
      
      // Use service role key for direct access - ensure we're using admin privileges
      const supabase = createSupabaseClient(true);
      console.log(`[AccessFile] Creating Supabase client with service role key, auth header: ${authHeader ? 'Present' : 'Missing'}`);
      
      try {
        // First, get the delivery record using delivery_id
        console.log(`[AccessFile] SQL equivalent: SELECT * FROM delivered_messages WHERE delivery_id = '${deliveryId}' LIMIT 1`);
        
        const { data: deliveryData, error: deliveryError } = await supabase
          .from('delivered_messages')
          .select('*')
          .eq('delivery_id', deliveryId)
          .maybeSingle(); // Using maybeSingle instead of single for better error handling
          
        if (deliveryError) {
          console.error(`[AccessFile] Delivery error: ${deliveryError.message}`);
          return new Response(
            JSON.stringify({ error: "Invalid delivery code", details: deliveryError.message }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (!deliveryData) {
          console.error(`[AccessFile] No delivery record found for delivery_id: ${deliveryId}`);
          
          // Try searching by message ID as fallback (in case the delivery_id was misinterpreted as message_id)
          try {
            const { data: altDeliveries } = await supabase
              .from('delivered_messages')
              .select('*')
              .eq('message_id', deliveryId)
              .limit(1);
              
            if (altDeliveries && altDeliveries.length > 0) {
              return new Response(
                JSON.stringify({ 
                  error: "Delivery ID mismatch", 
                  hint: "You may have provided a message ID instead of delivery ID",
                  correct_delivery_id: altDeliveries[0].delivery_id,
                  correction_url: `${url.origin}${url.pathname}?delivery=${altDeliveries[0].delivery_id}&recipient=${encodeURIComponent(recipientEmail)}`
                }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          } catch (fallbackError) {
            console.error("[AccessFile] Fallback delivery lookup error:", fallbackError);
          }
          
          return new Response(
            JSON.stringify({ error: "Invalid delivery code" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log(`[AccessFile] Found delivery record: ${JSON.stringify(deliveryData)}`);
        
        // Second, get the recipient record using recipient_id
        let recipientData = null;
        let recipientError = null;
        let usedRecipientId = null;

        try {
          console.log(`[AccessFile] Recipient ID being queried: ${deliveryData.recipient_id}`);
          const result = await supabase
            .from('recipients')
            .select('id, email')
            .eq('id', deliveryData.recipient_id)
            .maybeSingle();
            
          recipientData = result.data;
          recipientError = result.error;
          usedRecipientId = deliveryData.recipient_id;
        } catch (err) {
          console.error(`[AccessFile] Recipient error: ${err.message}`);
          recipientError = err;
        }
          
        if (recipientError || !recipientData) {
          console.error(`[AccessFile] Recipient error: ${recipientError?.message || "Recipient not found"}`);
          
          // Try direct email lookup as fallback
          try {
            console.log("[AccessFile] Attempting fallback recipient lookup by email");
            const { data: directRecipientData, error: directRecipientError } = await supabase
              .from('recipients')
              .select('id, email')
              .eq('email', decodeURIComponent(recipientEmail))
              .maybeSingle();
              
            if (!directRecipientError && directRecipientData) {
              console.log(`[AccessFile] Found recipient through direct email lookup ${JSON.stringify(directRecipientData)}`);
              // Use this recipient data instead
              recipientData = directRecipientData;
              recipientError = null;
              usedRecipientId = directRecipientData.id;
              
              // Continue with file processing instead of returning early
              console.log("[AccessFile] Continuing with file processing using found recipient");
            } else {
              console.error("[AccessFile] Fallback lookup also failed:", directRecipientError);
              
              // Return detailed error for debugging since we couldn't find the recipient at all
              return new Response(
                JSON.stringify({ 
                  error: "Invalid recipient", 
                  details: "Recipient not found by ID or email",
                  recipient_id: deliveryData.recipient_id,
                  delivery_id: deliveryId
                }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          } catch (fallbackError) {
            console.error("[AccessFile] Error in fallback recipient lookup:", fallbackError);
            
            // Return detailed error for debugging
            return new Response(
              JSON.stringify({ 
                error: "Invalid recipient", 
                details: recipientError ? recipientError.message : "Recipient not found",
                recipient_id: deliveryData.recipient_id,
                delivery_id: deliveryId
              }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        
        // Log found recipient data
        console.log(`[AccessFile] Found recipient with email: ${recipientData.email}`);
        
        // Validate recipient email matches
        if (recipientData.email.toLowerCase() !== decodeURIComponent(recipientEmail).toLowerCase()) {
          console.error(`[AccessFile] Email mismatch: ${recipientData.email} vs ${recipientEmail}`);
          return new Response(
            JSON.stringify({ error: "Invalid recipient email" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Get the message to verify the attachment exists
        const messageId = deliveryData.message_id;
        if (!messageId) {
          console.error("[AccessFile] Message ID missing from delivery record");
          return new Response(
            JSON.stringify({ 
              error: "Invalid delivery record", 
              details: "Message ID missing from delivery record",
              delivery: deliveryId
            }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log(`[AccessFile] Looking up message with ID: ${messageId}`);
        
        // Validate the messageId is a valid UUID format
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(messageId)) {
          console.error(`[AccessFile] Invalid message ID format: ${messageId}`);
          return new Response(
            JSON.stringify({ 
              error: "Invalid message ID format", 
              details: `Message ID ${messageId} is not a valid UUID`,
              message_id: messageId
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .select('attachments')
          .eq('id', messageId)
          .maybeSingle();
          
        if (messageError) {
          console.error(`[AccessFile] Message error: ${messageError.message}`);
          return new Response(
            JSON.stringify({ error: "Message not found", details: messageError.message, message_id: messageId }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (!messageData) {
          console.error(`[AccessFile] No message found with ID: ${messageId}`);
          
          // Try a direct bucket lookup as last resort - since we know the file path
          if (debugMode) {
            try {
              const bucketName = normalizedFilePath.indexOf('/') > -1 ? normalizedFilePath.split('/')[0] : 'message-attachments';
              const filePart = normalizedFilePath.indexOf('/') > -1 ? normalizedFilePath.substring(normalizedFilePath.indexOf('/') + 1) : normalizedFilePath;
              
              console.log(`[AccessFile] DEBUG MODE: Attempting direct bucket access to ${bucketName}/${filePart}`);
              
              // Check if file exists in storage
              const { data: fileData, error: fileError } = await supabase.storage
                .from(bucketName)
                .download(filePart);
                
              if (fileError) {
                console.error(`[AccessFile] File error: ${fileError.message}`);
                return new Response(
                  JSON.stringify({ 
                    error: "File not found in storage", 
                    details: fileError.message,
                    path: normalizedFilePath,
                    bucket: bucketName,
                    file: filePart
                  }),
                  { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
              
              // If we got here, we found the file directly in storage
              console.log(`[AccessFile] DEBUG MODE: Found file directly in storage`);
              
              // Return the file
              const headers = {
                ...corsHeaders,
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `${downloadMode ? 'attachment' : 'inline'}; filename="${filePart.split('/').pop()}"`,
                "Cache-Control": "no-cache"
              };
              
              return new Response(fileData, { headers });
            } catch (directAccessError) {
              console.error("[AccessFile] Debug mode direct access error:", directAccessError);
            }
          }
          
          return new Response(
            JSON.stringify({ 
              error: "Message not found", 
              details: "No message found with the provided ID",
              message_id: messageId,
              help: "This could be due to: 1) The message was deleted, 2) The message ID is incorrect, 3) Database connection issues"
            }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log(`[AccessFile] Found message with ID: ${messageId}`);
        
        // Verify the file exists in the attachments array
        const attachments = messageData.attachments || [];
        
        // Enhanced attachment matching logic
        // Try multiple variations of the path to find a match
        const normalizedPath = normalizeFilePath(filePath);
        const fileName = normalizedPath.split('/').pop() || '';

        console.log(`[AccessFile] Looking for attachment with path: ${normalizedPath} or filename: ${fileName}`);
        console.log(`[AccessFile] Available attachments:`, attachments.map((att: any) => att.path));

        // Find attachment with exact path match or similar path match (accounting for prefix differences)
        let attachment = attachments.find(
          (att: any) => 
            // Exact match on normalized path
            att.path === normalizedPath || 
            // Match if we strip 'file/' from both sides
            normalizeFilePath(att.path) === normalizedPath ||
            // Match by filename if paths are different
            (fileName && att.path.endsWith(fileName)) ||
            // Match if the paths only differ by the bucket name prefix
            (normalizedPath.includes('/') && att.path.endsWith(normalizedPath.substring(normalizedPath.indexOf('/') + 1)))
        );
        
        if (!attachment) {
          console.error(`[AccessFile] File not found in message attachments: ${normalizedPath}`);
          
          // List available attachments for debugging
          const availablePaths = attachments.map((att: any) => att.path);
          console.log(`[AccessFile] Available attachments:`, availablePaths);
          
          return new Response(
            JSON.stringify({ 
              error: "File not found in message", 
              details: `The file ${filePath} was not found in the message's attachments`,
              normalized_path: normalizedPath,
              available_files: availablePaths
            }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log(`[AccessFile] Found attachment: ${attachment.name} with path: ${attachment.path}`);
        
        // Process the bucket and file path
        let bucketName = 'message-attachments';
        let filePathInBucket = normalizedPath;
        
        // Check if the path includes a bucket prefix
        if (normalizedPath.includes('/')) {
          const pathParts = normalizedPath.split('/');
          if (pathParts[0] === 'message-attachments' || pathParts[0] === 'message_attachments') {
            bucketName = pathParts[0];
            filePathInBucket = pathParts.slice(1).join('/');
          }
        }
        
        console.log(`[AccessFile] Using bucket: ${bucketName}, path in bucket: ${filePathInBucket}`);
        
        // Try to download the file from storage
        const { data: fileData, error: fileError } = await supabase.storage
          .from(bucketName)
          .download(filePathInBucket);
          
        if (fileError || !fileData) {
          console.error(`[AccessFile] Error downloading file: ${fileError?.message || "No file data returned"}`);
          
          // Try alternative file path formats as a fallback
          const filePathVariations = [
            filePathInBucket,
            filePathInBucket.split('/').pop() || filePathInBucket, // Just the filename
            attachment.path, // The path from the attachment object
            normalizedPath  // The normalized original path
          ];
          
          // Try each variation
          for (const altPath of filePathVariations) {
            console.log(`[AccessFile] Trying alternative file path: ${altPath}`);
            
            try {
              const { data: altData, error: altError } = await supabase.storage
                .from(bucketName)
                .download(altPath);
                
              if (!altError && altData) {
                console.log(`[AccessFile] Found file using alternative path: ${altPath}`);
                
                // Return the file
                const headers = {
                  ...corsHeaders,
                  "Content-Type": attachment.type || "application/octet-stream",
                  "Content-Disposition": `${downloadMode ? 'attachment' : 'inline'}; filename="${attachment.name}"`,
                  "Cache-Control": "no-cache"
                };
                
                return new Response(altData, { headers });
              }
            } catch (altError) {
              console.error(`[AccessFile] Error with alternative path ${altPath}:`, altError);
            }
          }
          
          // If we've tried all variations and still failed, return an error
          return new Response(
            JSON.stringify({ 
              error: "File not accessible", 
              details: fileError ? fileError.message : "File not found in storage",
              bucket: bucketName,
              path: filePathInBucket,
              tried_paths: filePathVariations
            }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Return the file
        const headers = {
          ...corsHeaders,
          "Content-Type": attachment.type || "application/octet-stream",
          "Content-Disposition": `${downloadMode ? 'attachment' : 'inline'}; filename="${attachment.name}"`,
          "Cache-Control": "no-cache"
        };
        
        console.log(`[AccessFile] Successfully serving file: ${attachment.name}`);
        return new Response(fileData, { headers });
      } catch (error) {
        console.error('[AccessFile] Unhandled error during delivery access:', error);
        return new Response(
          JSON.stringify({ 
            error: "Server error while accessing file", 
            details: error.message || "Unknown error",
            stack: debugMode ? error.stack : undefined
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Handle direct authenticated access to files (when user is logged in)
      return new Response(
        JSON.stringify({ 
          error: "Missing delivery info", 
          details: "Both delivery ID and recipient email are required",
          provided: { 
            file: filePath ? "Yes" : "No", 
            delivery: deliveryId ? "Yes" : "No", 
            recipient: recipientEmail ? "Yes" : "No" 
          }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error('[AccessFile] Unhandled error:', error);
    return new Response(
      JSON.stringify({ 
        error: "Server error", 
        details: error.message || "Unknown error",
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
