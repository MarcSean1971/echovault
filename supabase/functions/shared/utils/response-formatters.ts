
import { corsHeaders } from "./cors-headers.ts";

/**
 * Create a successful response with CORS headers and consistent formatting
 */
export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString()
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

/**
 * Create an error response with CORS headers and consistent formatting
 */
export function createErrorResponse(error: any, status: number = 500) {
  const errorMessage = error instanceof Error ? error.message : 
                      (typeof error === 'string' ? error : 
                      (error.message || "Unknown error"));
  
  console.error("[ERROR]", errorMessage);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? undefined : error,
      timestamp: new Date().toISOString()
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
