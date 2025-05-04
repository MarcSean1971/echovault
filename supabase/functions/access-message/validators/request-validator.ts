
/**
 * Validate message access request parameters
 */
export async function validateMessageRequest(url: URL) {
  // Try to extract message ID from query parameters first
  let messageId = url.searchParams.get("id");
  
  // If not found in query params, try to extract from URL path (backwards compatibility)
  if (!messageId) {
    const pathParts = url.pathname.split('/');
    messageId = pathParts[pathParts.length - 1];
    // If last path part is the function name itself, then there's no ID in the path
    if (messageId === "access-message") {
      messageId = null;
    }
  }
  
  // Log the debugging info even if ID is missing (to help troubleshoot)
  console.log(`Request parameters: query=${JSON.stringify(Object.fromEntries(url.searchParams))}, path=${url.pathname}`);
  
  // Be more lenient with validation
  if (!messageId) {
    console.warn("Missing message ID in both query parameters and URL path");
    throw new Error("Missing message ID in both query parameters and URL path");
  }
  
  // Extract recipient and delivery info from query parameters
  const recipientEmail = url.searchParams.get("recipient");
  const deliveryId = url.searchParams.get("delivery");
  
  console.log(`Extracted parameters: messageId=${messageId}, recipient=${recipientEmail || "not provided"}, delivery=${deliveryId || "not provided"}`);
  
  return { messageId, recipientEmail, deliveryId: deliveryId || null };
}
