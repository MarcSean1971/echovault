
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
  
  if (!messageId) {
    throw new Error("Missing message ID in both query parameters and URL path");
  }
  
  // Extract recipient and delivery info from query parameters
  const recipientEmail = url.searchParams.get("recipient");
  const deliveryId = url.searchParams.get("delivery");
  
  // Log the extracted parameters for debugging
  console.log(`Extracted parameters: messageId=${messageId}, recipient=${recipientEmail || "not provided"}, delivery=${deliveryId || "not provided"}`);
  
  if (!recipientEmail) {
    console.warn(`Missing recipient email for message ${messageId}`);
  }
  
  if (!deliveryId) {
    console.warn(`Missing delivery ID for message ${messageId}`);
  }
  
  return { messageId, recipientEmail, deliveryId: deliveryId || null };
}
