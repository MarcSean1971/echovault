
// Follow Deno's ESM syntax
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allow CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get Supabase client
const supabaseClient = (req: Request) => {
  // Get authorization header
  const authHeader = req.headers.get('Authorization');
  
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: authHeader || '',
        },
      },
    }
  );
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const { pathname } = new URL(req.url);
    
    // Route for recording a check-in location
    if (pathname === '/record-checkin' && req.method === 'POST') {
      const { latitude, longitude, locationName, deviceInfo } = await req.json();
      
      // Get user ID from auth
      const supabase = supabaseClient(req);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Insert the check-in record
      const { data, error } = await supabase
        .from('check_in_locations')
        .insert({
          user_id: user.id,
          latitude,
          longitude,
          location_name: locationName,
          device_info: deviceInfo
        })
        .select('*')
        .single();
        
      if (error) {
        console.error('Error recording check-in:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Route for geocoding a location
    if (pathname === '/geocode' && req.method === 'GET') {
      const url = new URL(req.url);
      const latitude = url.searchParams.get('lat');
      const longitude = url.searchParams.get('lng');
      
      if (!latitude || !longitude) {
        return new Response(
          JSON.stringify({ error: 'Latitude and longitude are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Use Mapbox geocoding API to get location name
      const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`;
      
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Default response for unhandled routes
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
