
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Initialize Resend with the API key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to format date strings
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Function to get condition type in a readable format
function getConditionType(conditionType: string): string {
  switch (conditionType) {
    case 'no_check_in':
      return "Dead Man's Switch";
    case 'panic_trigger':
      return "Panic Trigger";
    case 'inactivity_to_date':
      return "Scheduled Delivery";
    case 'inactivity_to_recurring':
      return "Recurring Delivery";
    default:
      return conditionType.replace(/_/g, ' ');
  }
}

// Function to check if the deadline is approaching within the next 24 hours
function isDeadlineApproaching(deadline: Date): boolean {
  const now = new Date();
  const timeDiff = deadline.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  // Return true if deadline is within the next 24 hours
  return hoursDiff > 0 && hoursDiff <= 24;
}

// Function to calculate deadline based on last check-in and threshold
function calculateDeadline(lastChecked: string, hoursThreshold: number, minutesThreshold: number = 0): Date {
  const lastCheckDate = new Date(lastChecked);
  const deadline = new Date(lastCheckDate);
  deadline.setHours(deadline.getHours() + hoursThreshold);
  deadline.setMinutes(deadline.getMinutes() + minutesThreshold);
  return deadline;
}

// Function to send a reminder email
async function sendReminderEmail(
  userEmail: string, 
  userName: string,
  messageTitle: string,
  messageId: string,
  conditionType: string,
  deadline: Date,
  appUrl: string = "https://app.echovault.org"
) {
  try {
    console.log(`Sending reminder email to ${userEmail} for message: ${messageTitle}`);
    
    const checkInUrl = `${appUrl}/check-in`;
    const messageUrl = `${appUrl}/message/${messageId}`;
    const deadlineFormatted = formatDate(deadline.toISOString());
    const conditionTypeFormatted = getConditionType(conditionType);
    
    const { data, error } = await resend.emails.send({
      from: "EchoVault <notifications@echo-vault.app>",
      to: [userEmail],
      subject: `⚠️ Reminder: Your message "${messageTitle}" will trigger soon`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #e11d48; margin-top: 0;">Important Reminder</h1>
            <p style="font-size: 16px; margin-bottom: 0;">Your message is approaching its deadline</p>
          </div>
          
          <h2 style="color: #333; font-size: 20px; margin-bottom: 20px;">Hello ${userName || "there"},</h2>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            This is a reminder that your message <strong>"${messageTitle}"</strong> will be triggered soon if no action is taken.
          </p>
          
          <div style="background-color: #fff2f2; border-left: 4px solid #e11d48; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold;">
              Message Type: ${conditionTypeFormatted}
            </p>
            <p style="margin: 10px 0 0 0;">
              Deadline: <strong>${deadlineFormatted}</strong>
            </p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            To prevent this message from being sent, you need to check in before the deadline.
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${checkInUrl}" style="background-color: #2563eb; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Check In Now</a>
            <a href="${messageUrl}" style="background-color: #64748b; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; margin-left: 10px;">View Message Details</a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            This is an automated reminder from EchoVault. If you no longer wish to receive these reminders, 
            you can update your notification preferences or disarm the message in your dashboard.
          </p>
        </div>
      `,
    });
    
    if (error) {
      console.error("Failed to send reminder email:", error);
      throw error;
    }
    
    return { success: true, data };
  } catch (err) {
    console.error("Error sending reminder email:", err);
    throw err;
  }
}

// Function to send WhatsApp reminder
async function sendWhatsAppReminder(
  phoneNumber: string,
  userName: string,
  messageTitle: string,
  messageId: string,
  conditionType: string,
  deadline: Date,
  appUrl: string = "https://app.echovault.org"
) {
  try {
    if (!phoneNumber) {
      console.log("No phone number provided for WhatsApp reminder");
      return { success: false, error: "No phone number provided" };
    }
    
    console.log(`Sending WhatsApp reminder to ${phoneNumber} for message: ${messageTitle}`);
    
    const checkInUrl = `${appUrl}/check-in`;
    const deadlineFormatted = formatDate(deadline.toISOString());
    const conditionTypeFormatted = getConditionType(conditionType);
    
    // Create reminder message for WhatsApp
    const whatsAppMessage = `⚠️ REMINDER: Check-in required for "${messageTitle}"\n\n`+
      `Hello ${userName || "there"},\n\n`+
      `Your message "${messageTitle}" (${conditionTypeFormatted}) will be triggered if you don't check in before: ${deadlineFormatted}.\n\n`+
      `Please visit ${checkInUrl} to check in now.`;
    
    // Call the WhatsApp notification function
    const { data: whatsAppResult, error: whatsAppError } = await supabase.functions.invoke("send-whatsapp-notification", {
      body: {
        to: phoneNumber,
        message: whatsAppMessage,
        messageId: messageId,
        recipientName: userName,
        isEmergency: false // This is just a reminder, not an emergency
      }
    });
    
    if (whatsAppError) {
      console.error(`WhatsApp reminder sending error:`, whatsAppError);
      return { success: false, error: whatsAppError.message || "Unknown WhatsApp error" };
    }
    
    console.log(`WhatsApp reminder sent successfully to ${phoneNumber}`);
    return { success: true, data: whatsAppResult };
    
  } catch (error: any) {
    console.error(`Error sending WhatsApp reminder:`, error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

// Main handler function
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("Starting reminder check...");
    
    // Process any specific message ID if provided
    let messageId: string | undefined;
    try {
      const requestData = await req.json();
      messageId = requestData.messageId;
      if (messageId) {
        console.log(`Checking specific message ID: ${messageId}`);
      }
    } catch (e) {
      // No request body or not JSON, continue with all messages
    }
    
    // Get all active conditions
    const conditionsQuery = supabase
      .from("message_conditions")
      .select(`
        *,
        messages:message_id (
          id, 
          title, 
          user_id
        )
      `)
      .eq("active", true);
      
    if (messageId) {
      conditionsQuery.eq("message_id", messageId);
    }
    
    const { data: conditions, error: conditionsError } = await conditionsQuery;
      
    if (conditionsError) {
      throw new Error(`Error fetching conditions: ${conditionsError.message}`);
    }
    
    console.log(`Found ${conditions?.length || 0} active conditions`);
    
    if (!conditions || conditions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active conditions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    // Track reminders to be sent
    const remindersSent = [];
    
    // Process each condition
    for (const condition of conditions) {
      if (!condition.last_checked) {
        console.log(`Skipping condition ${condition.id}: Missing last_checked`);
        continue;
      }
      
      // Calculate the deadline
      const hoursThreshold = condition.hours_threshold || 0;
      const minutesThreshold = condition.minutes_threshold || 0;
      
      if (hoursThreshold === 0 && minutesThreshold === 0) {
        console.log(`Skipping condition ${condition.id}: Zero threshold`);
        continue;
      }
      
      const deadline = calculateDeadline(condition.last_checked, hoursThreshold, minutesThreshold);
      console.log(`Condition ${condition.id} deadline: ${deadline.toISOString()}, hours: ${hoursThreshold}, minutes: ${minutesThreshold}`);
      
      // Check if the deadline is approaching (within 24 hours)
      if (isDeadlineApproaching(deadline)) {
        console.log(`Deadline approaching for condition ${condition.id}, message: ${condition.messages.title}`);
        
        // Get the user's email
        const { data: user, error: userError } = await supabase
          .auth
          .admin
          .getUserById(condition.messages.user_id);
          
        if (userError) {
          console.error(`Error fetching user for user_id ${condition.messages.user_id}:`, userError);
          continue;
        }
        
        // Get the user's profile for name and WhatsApp number
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, whatsapp_number")
          .eq("id", condition.messages.user_id)
          .single();
          
        const userName = profile ? 
          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
          "there";
        
        // Get user's WhatsApp number if available
        const whatsappNumber = profile?.whatsapp_number || null;
        
        // Check if we have the user's email
        if (user?.email) {
          try {
            // Check if a reminder has already been sent recently (in the last 6 hours)
            // Reduced from 12 to 6 hours to increase reminder frequency
            const { data: sentReminders, error: reminderError } = await supabase
              .from("sent_reminders")
              .select("*")
              .eq("condition_id", condition.id)
              .gte("sent_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString());
              
            if (reminderError) {
              console.error(`Error checking sent reminders for condition ${condition.id}:`, reminderError);
              continue;
            }
            
            // If no reminder was sent in the last 6 hours, send one
            if (!sentReminders || sentReminders.length === 0) {
              // Send email reminder
              const emailResult = await sendReminderEmail(
                user.email, 
                userName,
                condition.messages.title,
                condition.messages.id,
                condition.condition_type,
                deadline
              );
              
              // Send WhatsApp reminder if number is available
              let whatsappResult = { success: false, error: "WhatsApp number not available" };
              if (whatsappNumber) {
                whatsappResult = await sendWhatsAppReminder(
                  whatsappNumber,
                  userName,
                  condition.messages.title,
                  condition.messages.id,
                  condition.condition_type,
                  deadline
                );
              }
              
              // Record that we sent a reminder
              const { error: insertError } = await supabase
                .from("sent_reminders")
                .insert({
                  condition_id: condition.id,
                  message_id: condition.messages.id,
                  user_id: condition.messages.user_id,
                  sent_at: new Date().toISOString(),
                  deadline: deadline.toISOString()
                });
                
              if (insertError) {
                console.error(`Error recording sent reminder for condition ${condition.id}:`, insertError);
              } else {
                remindersSent.push({
                  messageId: condition.messages.id,
                  messageTitle: condition.messages.title,
                  deadline: deadline.toISOString(),
                  emailSent: emailResult.success,
                  whatsappSent: whatsappResult.success,
                  whatsappNumber: whatsappNumber ? "Available" : "Not available"
                });
              }
            } else {
              console.log(`Skipping reminder for condition ${condition.id}: Reminder already sent in the last 6 hours`);
            }
          } catch (err) {
            console.error(`Error processing reminder for condition ${condition.id}:`, err);
          }
        } else {
          console.log(`No email found for user ${condition.messages.user_id}`);
        }
      } else {
        console.log(`Deadline not approaching for condition ${condition.id}, deadline: ${deadline.toISOString()}`);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        message: `Reminder check completed. Sent ${remindersSent.length} reminders.`,
        remindersSent 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error: any) {
    console.error("Error in send-reminder-emails function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "An unknown error occurred"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
