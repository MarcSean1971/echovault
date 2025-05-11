
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createSupabaseClient } from "./supabase-client.ts";
import { corsHeaders } from "./cors-headers.ts";

console.log("[AccessFile] Starting simplified file access function with improved validation");

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
    console.log(`[AccessFile] Search params: ${url.search}`);

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
        
        // Log received parameters for debugging
        console.log(`[AccessFile] POST params - File: ${filePath}, Delivery: ${delivery || 'none'}, Recipient: ${recipient ? recipient.substring(0, 3) + '...' : 'none'}`);
        
        // If we have delivery context, use it
        if (delivery && recipient) {
          // Return URL for client to use
          return new Response(
            JSON.stringify({ 
              url: `${url.origin}/functions/v1/access-file/file/${encodeURIComponent(filePath)}?delivery=${encodeURIComponent(delivery)}&recipient=${encodeURIComponent(recipient)}&mode=${mode || 'view'}&download-file=${!!download}` 
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
    const debugMode = url.searchParams.has('debug');

    // Get auth token from header, URL parameter, or fallback to service role
    let authHeader = req.headers.get('Authorization');
    const authParamToken = url.searchParams.get('auth_token');
    
    console.log(`[AccessFile] GET params - File: ${filePath}, Delivery: ${deliveryId || 'none'}, Download: ${downloadMode}, Debug: ${debugMode}`);
    console.log(`[AccessFile] Auth Header: ${authHeader ? 'Present' : 'Missing'}, Auth Param: ${authParamToken ? 'Present' : 'Missing'}`);
    
    // For delivery-based access, validate parameters
    if (deliveryId && recipientEmail) {
      console.log("[AccessFile] Processing delivery-based access request");
      console.log(`[AccessFile] Delivery ID exact value: '${deliveryId}'`);
      
      // Create Supabase client with service role key
      const supabase = createSupabaseClient(null); // Always use service role
      
      // First, get the delivered_message record
      let deliveryData = null;
      let deliveryError = null;
      
      try {
        // Log the exact SQL that we would be executing (for debugging)
        console.log(`[AccessFile] SQL equivalent: SELECT * FROM delivered_messages WHERE delivery_id = '${deliveryId}' LIMIT 1`);
        
        const result = await supabase
          .from('delivered_messages')
          .select('message_id, recipient_id, condition_id')
          .eq('delivery_id', deliveryId)
          .single();
          
        deliveryData = result.data;
        deliveryError = result.error;
        
        if (deliveryError) {
          console.error(`[AccessFile] Delivery lookup error:`, deliveryError);
          console.log(`[AccessFile] Full error details:`, JSON.stringify(deliveryError));
          
          // Try a direct RPC call if the standard query fails
          if (debugMode) {
            console.log("[AccessFile] Debug mode: Attempting direct SQL query via RPC");
            
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_delivery_by_id', {
              p_delivery_id: deliveryId
            });
            
            if (!rpcError && rpcData && rpcData.length > 0) {
              deliveryData = rpcData[0];
              deliveryError = null;
              console.log("[AccessFile] Direct RPC query succeeded:", deliveryData);
            } else {
              console.error("[AccessFile] Direct RPC query also failed:", rpcError);
            }
          }
        }
      } catch (queryError) {
        console.error(`[AccessFile] Error querying delivery: ${queryError.message}`);
        deliveryError = queryError;
      }
        
      if (deliveryError || !deliveryData) {
        return new Response(
          JSON.stringify({ 
            error: "Invalid delivery ID", 
            details: deliveryError ? deliveryError.message : "No matching delivery found",
            delivery_id: deliveryId
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Second, get the recipient record using recipient_id
      let recipientData = null;
      let recipientError = null;
      let usedRecipientId = null;

      try {
        const result = await supabase
          .from('recipients')
          .select('email')
          .eq('id', deliveryData.recipient_id)
          .single();
          
        recipientData = result.data;
        recipientError = result.error;
        usedRecipientId = deliveryData.recipient_id;
      } catch (err) {
        recipientError = err;
      }
        
      if (recipientError || !recipientData) {
        console.error(`[AccessFile] Recipient error: ${recipientError?.message || "Recipient not found"}`);
        console.error(`[AccessFile] Recipient ID being queried: ${deliveryData.recipient_id}`);
        
        // Try a more direct lookup approach as fallback
        try {
          console.log("[AccessFile] Attempting fallback recipient lookup by email");
          
          const { data: directRecipientData, error: directRecipientError } = await supabase
            .from('recipients')
            .select('id, email')
            .eq('email', recipientEmail.toLowerCase())
            .maybeSingle();
            
          if (!directRecipientError && directRecipientData) {
            console.log("[AccessFile] Found recipient through direct email lookup", directRecipientData);
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

      // Verify the recipient email with case-insensitive comparison
      if (recipientData.email.toLowerCase() !== recipientEmail.toLowerCase()) {
        // Log email comparison details
        console.log(`[AccessFile] Email mismatch - DB: '${recipientData.email.toLowerCase()}', Request: '${recipientEmail.toLowerCase()}'`);
        
        return new Response(
          JSON.stringify({ error: "Recipient email does not match" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Get the message to verify the attachment exists
      const messageId = deliveryData.message_id;
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('attachments')
        .eq('id', messageId)
        .single();
        
      if (messageError || !messageData) {
        return new Response(
          JSON.stringify({ error: "Message not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Verify the attachment exists in the message with more flexible matching
      const attachments = messageData.attachments || [];
      
      // Log attachment info for debugging
      console.log(`[AccessFile] Message has ${attachments.length} attachments`);
      console.log(`[AccessFile] Requested file path: ${filePath}`);
      if (attachments.length > 0) {
        console.log(`[AccessFile] First attachment path: ${attachments[0].path}`);
      }
      
      // Find the matching attachment with more flexible matching
      const requestedAttachment = attachments.find((att: any) => {
        // More flexible attachment matching
        return att.path === filePath || 
               att.path.endsWith(filePath) || 
               filePath.endsWith(att.path) ||
               att.path.includes(filePath) ||
               filePath.includes(att.path);
      });
      
      if (!requestedAttachment) {
        // If no match, try again with basic filename comparison
        const requestedFileName = filePath.split('/').pop();
        const fileNameMatch = attachments.find((att: any) => {
          const attFileName = att.path.split('/').pop();
          return attFileName === requestedFileName;
        });
        
        if (fileNameMatch) {
          console.log(`[AccessFile] Found attachment by filename match`);
          return await handleFileDownload(supabase, fileNameMatch.path, fileNameMatch.name || requestedFileName, 
            fileNameMatch.type || "application/octet-stream", downloadMode);
        }
        
        return new Response(
          JSON.stringify({ 
            error: "Attachment not found in message", 
            details: { 
              requestedPath: filePath,
              availablePaths: attachments.map((a: any) => ({ path: a.path, name: a.name }))
            }
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Extract metadata from the matched attachment
      const fileName = requestedAttachment.name || filePath.split('/').pop() || 'download';
      const fileType = requestedAttachment.type || "application/octet-stream";
      
      console.log(`[AccessFile] Found matching attachment: ${fileName}, type: ${fileType}`);
      
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

// Helper function to handle file downloads with enhanced error reporting
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
      
      console.log(`[AccessFile] Error with primary bucket: ${fileError.message}`);
      console.log(`[AccessFile] Trying alternate bucket: ${altBucketName}`);
      
      const { data: altFileData, error: altFileError } = await supabase.storage
        .from(altBucketName)
        .download(filePathInBucket);
        
      if (altFileError) {
        console.error(`[AccessFile] All bucket attempts failed - Primary error: ${fileError.message}, Alt error: ${altFileError.message}`);
        
        // Try with just the filename as a last resort
        const justFileName = filePathInBucket.split('/').pop();
        if (justFileName !== filePathInBucket) {
          console.log(`[AccessFile] Trying with just filename: ${justFileName}`);
          
          const { data: simpleFileData, error: simpleFileError } = await supabase.storage
            .from(bucketName)
            .download(justFileName);
            
          if (!simpleFileError && simpleFileData) {
            console.log(`[AccessFile] Successfully retrieved file using simplified path`);
            return prepareFileResponse(simpleFileData, fileType, fileName, downloadMode);
          }
        }
        
        return new Response(
          JSON.stringify({ 
            error: "File not found in storage", 
            details: { 
              primaryError: fileError.message,
              alternateError: altFileError.message,
              path: filePathInBucket,
              bucket: bucketName,
              alternateBucket: altBucketName
            }
          }),
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
