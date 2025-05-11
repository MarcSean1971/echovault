
// CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Create a success response with standardized format
 */
export function createSuccessResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      ...data,
      timestamp: new Date().toISOString()
    }),
    { 
      status, 
      headers: { 
        "Content-Type": "application/json", 
        ...corsHeaders 
      } 
    }
  );
}

/**
 * Create an error response with standardized format
 */
export function createErrorResponse(error: any, status = 500) {
  const errorMessage = error instanceof Error ? error.message : 
                      (typeof error === 'string' ? error : 
                      (error.message || "Unknown error"));
  
  console.error("Error:", errorMessage);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? undefined : error,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { 
        "Content-Type": "application/json", 
        ...corsHeaders 
      }
    }
  );
}
