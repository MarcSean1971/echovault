
import { corsHeaders } from "./cors-headers.ts";

/**
 * Create a standardized error response
 * @param message Error message or error object
 * @param status HTTP status code
 * @returns Response object
 */
export function createErrorResponse(message: string | Error, status: number = 400): Response {
  const errorMessage = message instanceof Error ? message.message : message;
  
  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage
    }),
    {
      status: status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

/**
 * Create a standardized success response
 * @param data Response data
 * @returns Response object
 */
export function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}
