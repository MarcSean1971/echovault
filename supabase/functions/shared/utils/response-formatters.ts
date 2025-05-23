
import { corsHeaders } from "./cors-headers.ts";

/**
 * Create a success response with proper CORS headers
 */
export function createSuccessResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Create an error response with proper CORS headers
 */
export function createErrorResponse(error: any, status: number = 500) {
  console.error("[ERROR]", error);
  
  const message = error?.message || error?.toString() || "Unknown error";
  
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}
