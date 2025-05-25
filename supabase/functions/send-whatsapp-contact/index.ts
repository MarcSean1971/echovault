
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

    // Create Supabase client for storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create vCard content
    const vCardContent = createVCard(userProfile);
    
    // Create filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const fileName = `contact-${userProfile.first_name}-${timestamp}.vcf`;
    
    // Upload vCard to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contact-cards')
      .upload(fileName, vCardContent, {
        contentType: 'text/vcard',
        upsert: false
      });

    if (uploadError) {
      console.error('Failed to upload vCard:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to create contact card' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get public URL for the vCard
    const { data: urlData } = supabase.storage
      .from('contact-cards')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate contact card URL' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Twilio credentials
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const appWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');
    
    if (!accountSid || !authToken || !appWhatsAppNumber) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send vCard via Twilio WhatsApp API
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const authHeader = `Basic ${btoa(`${accountSid}:${authToken}`)}`;

    // Format destination number (this should be the admin/operator number)
    // For now, sending to the app's own number as a test
    const adminNumber = appWhatsAppNumber.replace('whatsapp:', '');

    const messageData = {
      To: adminNumber,
      From: appWhatsAppNumber,
      Body: `New subscription request from ${userProfile.first_name} ${userProfile.last_name || ''}`,
      MediaUrl: urlData.publicUrl
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
      
      // Cleanup the uploaded file if message failed
      await supabase.storage.from('contact-cards').remove([fileName]);
      
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

    // Cleanup the uploaded file after successful send (optional)
    setTimeout(async () => {
      await supabase.storage.from('contact-cards').remove([fileName]);
    }, 300000); // Remove after 5 minutes

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
  
  let vCard = `BEGIN:VCARD\r\n`;
  vCard += `VERSION:3.0\r\n`;
  vCard += `FN:${fullName}\r\n`;
  vCard += `N:${last_name || ''};${first_name};;;\r\n`;
  vCard += `TEL;TYPE=CELL:${whatsapp_number}\r\n`;
  
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
