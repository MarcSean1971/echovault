
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../shared/utils/cors-headers.ts";
import { recordReminderSent, updateNextReminderTime, markRemindersObsolete } from "./db/reminder-tracking.ts";
import { getMessageAndCondition } from "./db/message-queries.ts";
import { sendEmail } from "./services/email-service.ts";
import { sendSms } from "./services/sms-service.ts";
import { sendWhatsApp } from "./services/whatsapp-service.ts";

// Supabase client
const supabaseClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
    throw new Error("Supabase configuration is missing.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  });
};

// Response helper
const jsonResponse = (obj: object, status: number = 200) => {
  return new Response(
    JSON.stringify(obj),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
};

// Main handler function
serve(async (req: Request) => {
  // Handle CORS pre-flight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const requestJson = await req.json();
    const { messageId, conditionId, action, debug, forceSend, recipient } = requestJson;

    console.log("Request received:", requestJson);

    if (!messageId) {
      return jsonResponse({ error: "Missing messageId parameter" }, 400);
    }

    // Fetch message and condition details
    const { message, condition, error: queryError } = await getMessageAndCondition(messageId, conditionId);

    if (queryError) {
      console.error("Error fetching message and condition:", queryError);
      return jsonResponse({ error: queryError.message || "Error fetching message and condition" }, 500);
    }

    if (!message || !condition) {
      return jsonResponse({ error: "Message or condition not found" }, 404);
    }

    // Action: Send reminder emails
    if (!action || action === "send-reminder") {
      console.log("Running send-reminder action");

      // Check if scheduled_at is within the last 5 minutes
      const now = new Date();
      const scheduledAt = new Date(condition.next_reminder_at || now);
      const diffInMinutes = (now.getTime() - scheduledAt.getTime()) / 60000;

      if (diffInMinutes > 5 && forceSend !== true) {
        console.warn(`Skipping reminder for message ${messageId} because it is more than 5 minutes late (scheduled at ${scheduledAt.toISOString()})`);
        return jsonResponse({
          success: false,
          message: "Skipping late reminder"
        });
      }

      // Send notifications to recipients
      try {
        // Determine delivery channels based on condition and recipient
        const deliveryChannels = condition.delivery_channels || ['email']; // Default to email

        // Send notifications via selected channels
        for (const channel of deliveryChannels) {
          switch (channel) {
            case 'email':
              if (debug) console.log("Sending email notification");
              await sendEmail(message, condition, recipient);
              break;
            case 'sms':
              if (debug) console.log("Sending SMS notification");
              await sendSms(message, condition);
              break;
            case 'whatsapp':
              if (debug) console.log("Sending WhatsApp notification");
              await sendWhatsApp(message, condition);
              break;
            default:
              console.warn(`Unsupported delivery channel: ${channel}`);
          }
        }

        // Record reminder as sent
        const recordSuccess = await recordReminderSent(
          message.id,
          condition.id,
          condition.trigger_date,
          message.user_id,
          condition.next_reminder_at
        );

        if (!recordSuccess) {
          console.error("Failed to record reminder as sent");
        }

        // Update next reminder time
        const nextReminderTime = null; // No more reminders
        const updateSuccess = await updateNextReminderTime(condition.id, nextReminderTime);

        if (!updateSuccess) {
          console.error("Failed to update next reminder time");
        }

        return jsonResponse({
          success: true,
          message: "Reminder sent successfully",
          action: "send-reminder"
        });
      } catch (error) {
        console.error("Error sending reminder:", error);
        return jsonResponse({ error: error.message || "Error sending reminder" }, 500);
      }
    }

    // Action: Mark reminders as obsolete
    if (action === "mark-obsolete") {
      console.log("Running mark-obsolete action");
      
      if (!messageId || !conditionId) {
        return jsonResponse({ 
          error: "Missing required parameters for mark-obsolete action" 
        }, 400);
      }
      
      // CRITICAL FIX: Extract the isEdit parameter and pass it to markRemindersObsolete
      const isEdit = (requestJson.isEdit === true);
      console.log(`Mark obsolete action - isEdit parameter: ${isEdit}`);
      
      try {
        const result = await markRemindersObsolete(conditionId, messageId, isEdit);
        return jsonResponse({ 
          success: result, 
          action: "mark-obsolete" 
        });
      } catch (error) {
        console.error("Error in mark-obsolete action:", error);
        return jsonResponse({ 
          error: error.message || "Error marking reminders as obsolete" 
        }, 500);
      }
    }

    // Action: Test email
    if (action === "test") {
      console.log("Running test action");

      if (!recipient) {
        return jsonResponse({ error: "Missing recipient parameter" }, 400);
      }

      try {
        // Send test email
        await sendEmail(message, condition, recipient, true);

        return jsonResponse({
          success: true,
          message: "Test email sent successfully",
          action: "test"
        });
      } catch (error) {
        console.error("Error sending test email:", error);
        return jsonResponse({ error: error.message || "Error sending test email" }, 500);
      }
    }

    return jsonResponse({ error: "Unknown action" }, 400);

  } catch (error) {
    console.error("Unexpected error:", error);
    return jsonResponse({ error: error.message || "Unexpected error" }, 500);
  }
});
