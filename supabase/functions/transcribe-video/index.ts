
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
    
    // Create a blob with the correct MIME type
    // IMPORTANT: For OpenAI Whisper API, we must use audio/* MIME type
    // Even though the input is video, we'll label it as audio for the API
    const blob = new Blob([bytes], { type: 'audio/mp4' });
    
    // Create FormData for the OpenAI API
    const formData = new FormData();
    formData.append('file', blob, 'audio.mp4'); // Use audio extension to help the API identify it correctly
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    
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
      
      // Extract the specific error message if possible
      let errorMessage = `OpenAI API returned an error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error && errorJson.error.message) {
          errorMessage = errorJson.error.message;
          
          // Provide more helpful context based on common issues
          if (errorMessage.includes('Invalid file format')) {
            errorMessage = "The audio format could not be processed. Please try recording with clearer audio or using a different device.";
          } else if (errorMessage.includes('too large')) {
            errorMessage = "The recording is too large for transcription. Please make a shorter recording.";
          }
        }
      } catch (e) {
        // If parsing fails, use the original error message
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log("Transcription successful, text:", data.text.substring(0, 50) + "...");
    
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
