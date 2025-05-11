
// Re-export utility functions from their respective files
export { corsHeaders } from "./utils/cors-headers.ts";
export { createSuccessResponse, createErrorResponse } from "./utils/response-formatters.ts";
export { extractWhatsAppMessageData } from "./utils/message-extractor.ts";
export { sendWhatsAppMessage } from "./services/whatsapp-service.ts";
export { formatWhatsAppNumber } from "./utils/phone-formatter.ts";
export { getTwilioCredentials } from "./utils/twilio-credentials.ts";
