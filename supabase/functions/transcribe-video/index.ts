
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoBase64 } = await req.json();
    
    if (!videoBase64) {
      throw new Error('No video data provided');
    }

    console.log("Received video data for transcription, processing...");
    
    // Convert base64 to binary data
    const binaryString = atob(videoBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create a blob with the CORRECT MIME type - webm audio is supported by Whisper
    const blob = new Blob([bytes], { type: 'audio/webm' });
    
    // Create FormData for the OpenAI API
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm'); // Changed filename to indicate audio content
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Assuming English language
    
    console.log("Sending request to OpenAI Whisper API...");
    
    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API returned an error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Transcription successful!");
    
    return new Response(JSON.stringify({ 
      transcription: data.text,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in transcribe-video function:", error);
    return new Response(JSON.stringify({ 
      error: error.message, 
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
