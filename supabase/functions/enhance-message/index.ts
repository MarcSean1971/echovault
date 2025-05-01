
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { text, enhancementType } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let systemPrompt = "You are a helpful assistant that enhances text.";
    
    // Customize prompt based on enhancement type
    switch (enhancementType) {
      case "improve":
        systemPrompt = "You are a skilled editor. Improve the writing quality, fix grammar and spelling errors, and enhance clarity. Return only the improved text without explanations.";
        break;
      case "professional":
        systemPrompt = "You are a professional writer. Convert the given text into professional business language. Return only the converted text without explanations.";
        break;
      case "summarize":
        systemPrompt = "You are a summarization expert. Create a concise summary of the given text. Return only the summary without explanations.";
        break;
      case "expand":
        systemPrompt = "You are a content developer. Expand on the given text with more details and elaboration. Return only the expanded text without explanations.";
        break;
      default:
        systemPrompt = "You are a helpful assistant that enhances text. Improve the writing quality of the given text. Return only the improved text without explanations.";
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to process text with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const enhancedText = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ enhancedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in enhance-message function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
