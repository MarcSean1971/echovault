
import { corsHeaders } from "./cors-headers.ts";

export function createSuccessResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify({ success: true, data }),
    { 
      status,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      } 
    }
  );
}

export function createErrorResponse(error: any, status: number = 500) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error';
  
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }),
    { 
      status,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      } 
    }
  );
}
