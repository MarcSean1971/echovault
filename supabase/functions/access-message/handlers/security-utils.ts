
import { validateMessageRequest, validateMessageAuthorization, checkSecurityConditions } from "../validators/index.ts";
import { htmlHeaders } from "./response-utils.ts";
import { generateErrorResponse } from "./response-utils.ts";

/**
 * Validate request parameters and return them or an error response
 */
export async function validateRequestParameters(url: URL): Promise<{ messageId: string, recipientEmail: string, deliveryId: string } | Response> {
  try {
    const validatedParams = await validateMessageRequest(url);
    return validatedParams;
  } catch (paramError: any) {
    console.error("Parameter validation error:", paramError.message);
    return generateErrorResponse("Error", paramError.message, 400);
  }
}

/**
 * Validate message authorization and return message data or error response
 */
export async function validateMessageAuth(messageId: string, recipientEmail: string): Promise<{ 
  message: any, 
  condition: any, 
  authorizedRecipients: any[] 
} | Response> {
  try {
    return await validateMessageAuthorization(messageId, recipientEmail);
  } catch (authError: any) {
    console.error("Authorization error:", authError.message);
    return generateErrorResponse(
      "Access Denied", 
      authError.message, 
      authError.message.includes("not found") ? 404 : 403
    );
  }
}

/**
 * Log security settings for debugging
 */
export function logSecuritySettings(securitySettings: any, condition: any) {
  const { hasPinCode, pinVerified, hasDelayedAccess, hasExpiry, isExpired } = securitySettings;
  
  console.log(`Security settings: hasPinCode=${hasPinCode}, pinVerified=${pinVerified}, hasDelayedAccess=${hasDelayedAccess}, hasExpiry=${hasExpiry}, isExpired=${isExpired}`);
  console.log(`Message condition type: ${condition.condition_type}, PIN code exists: ${!!condition.pin_code}`);
}

/**
 * Generate the appropriate response based on security conditions
 */
export function determineSecurityResponse(
  message: any,
  securitySettings: any,
  deliveryId: string,
  recipientEmail: string
) {
  return {
    isExpired: securitySettings.isExpired,
    isDelayed: securitySettings.hasDelayedAccess && securitySettings.unlockDate && securitySettings.unlockDate > new Date(),
    requiresPin: securitySettings.hasPinCode && !securitySettings.pinVerified,
    unlockDate: securitySettings.unlockDate,
    expiryDate: securitySettings.expiryDate
  };
}
