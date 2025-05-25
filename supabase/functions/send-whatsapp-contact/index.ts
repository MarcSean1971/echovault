
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userProfile } = await req.json();
    
    if (!userProfile || !userProfile.first_name || !userProfile.whatsapp_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required user profile information' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get app's WhatsApp number
    const appWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');
    if (!appWhatsAppNumber) {
      return new Response(
        JSON.stringify({ error: 'App WhatsApp number not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create vCard content
    const vCardContent = createVCard(userProfile);
    
    // Get Twilio credentials
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    
    if (!accountSid || !authToken) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Clean phone numbers
    const cleanAppNumber = appWhatsAppNumber.replace('whatsapp:', '').trim();
    const fromNumber = appWhatsAppNumber; // Keep original format for sending

    // Send vCard via Twilio WhatsApp API
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const authHeader = `Basic ${btoa(`${accountSid}:${authToken}`)}`;

    // Create the message with vCard as media
    const messageData = {
      To: cleanAppNumber.startsWith('+') ? cleanAppNumber : `+${cleanAppNumber}`,
      From: fromNumber,
      Body: `New subscription request from ${userProfile.first_name} ${userProfile.last_name || ''}`,
      MediaUrl: `data:text/vcard;base64,${btoa(vCardContent)}`
    };

    const formBody = Object.entries(messageData)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');

    const response = await fetch(twilioEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: formBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send contact card' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await response.json();
    console.log('Contact card sent successfully:', result.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.sid,
        message: 'Contact card sent successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-whatsapp-contact:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function createVCard(userProfile: any): string {
  const { first_name, last_name, whatsapp_number, backup_email, email } = userProfile;
  
  const fullName = `${first_name} ${last_name || ''}`.trim();
  const cleanPhone = whatsapp_number.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;
  
  let vCard = `BEGIN:VCARD\r\n`;
  vCard += `VERSION:3.0\r\n`;
  vCard += `FN:${fullName}\r\n`;
  vCard += `N:${last_name || ''};${first_name};;;\r\n`;
  vCard += `TEL;TYPE=CELL:${formattedPhone}\r\n`;
  
  if (email) {
    vCard += `EMAIL:${email}\r\n`;
  }
  
  if (backup_email && backup_email !== email) {
    vCard += `EMAIL;TYPE=HOME:${backup_email}\r\n`;
  }
  
  vCard += `NOTE:Subscription request for emergency notifications and check-in reminders\r\n`;
  vCard += `ORG:Safety App Subscriber\r\n`;
  vCard += `END:VCARD\r\n`;
  
  return vCard;
}
