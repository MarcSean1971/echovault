
import { supabaseClient } from "../supabase-client.ts";
import { sendEmail } from "./email-service.ts";
import { formatReminderTime } from "../utils/format-utils.ts";

export interface ReminderResult {
  recipientId: string;
  recipientEmail: string;
  reminderType: string;
  success: boolean;
  error?: string;
  deliveryId?: string;
}

/**
 * Send a reminder to the message creator for check-in type conditions
 * FIXED: Use consistent methods to retrieve the creator's email address
 * FIXED: Enhanced email styling to match Final Alert emails
 */
export async function sendCreatorReminder(
  messageId: string,
  conditionId: string,
  messageTitle: string,
  userId: string,
  hoursUntilDeadline: number,
  scheduledAt: string,
  debug: boolean = false
): Promise<ReminderResult[]> {
  try {
    if (debug) console.log(`[REMINDER-SENDER] Sending creator reminder for message ${messageId} to user ${userId}`);
    
    const supabase = supabaseClient();
    const results: ReminderResult[] = [];
    
    // CRITICAL FIX: Get the creator's email using a consistent, reliable method
    // First try auth.users directly (this works for final alerts)
    let creatorEmail = null;
    let creatorName = "Message Creator";
    
    try {
      // Get user info from auth.users directly (same method used in final alerts)
      const { data: userData, error: userError } = await supabase.auth
        .admin.getUserById(userId);
      
      if (userError) throw userError;
      
      if (userData && userData.user && userData.user.email) {
        creatorEmail = userData.user.email;
        if (debug) console.log(`[REMINDER-SENDER] Found creator email from auth.users: ${creatorEmail}`);
      } else {
        throw new Error("No email found in user data");
      }
    } catch (adminApiError) {
      // Fallback method if admin API fails
      console.error("[REMINDER-SENDER] Error using admin.getUserById:", adminApiError);
      console.log("[REMINDER-SENDER] Trying fallback method to get creator email");
      
      try {
        // Fallback to querying auth.users directly (needs admin privileges)
        const { data: authUser, error: authError } = await supabase
          .from("auth.users")
          .select("email")
          .eq("id", userId)
          .single();
          
        if (authError) throw authError;
        
        if (authUser && authUser.email) {
          creatorEmail = authUser.email;
          if (debug) console.log(`[REMINDER-SENDER] Found creator email from auth.users table: ${creatorEmail}`);
        } else {
          throw new Error("No email found in auth.users query");
        }
      } catch (authQueryError) {
        console.error("[REMINDER-SENDER] Error querying auth.users:", authQueryError);
        
        // Last-resort fallback: try to get from profiles if available
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("backup_email")
            .eq("id", userId)
            .single();
            
          if (profileError) throw profileError;
          
          // If profile has a backup email, use that
          if (profile && profile.backup_email) {
            creatorEmail = profile.backup_email;
            console.log(`[REMINDER-SENDER] Using backup email as fallback: ${creatorEmail}`);
          } else {
            throw new Error("No backup email found in profile");
          }
        } catch (profileError) {
          console.error("[REMINDER-SENDER] Error getting profile:", profileError);
          throw new Error("Failed to get any email for creator");
        }
      }
    }
    
    // Verify we have an email to send to
    if (!creatorEmail) {
      console.error(`[REMINDER-SENDER] No email found for user ${userId}`);
      return [{
        recipientId: userId,
        recipientEmail: "unknown",
        reminderType: "creator_check_in",
        success: false,
        error: "No email address found for creator"
      }];
    }
    
    // Get creator name for personalization
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .single();
        
      if (profileData) {
        creatorName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || "Message Creator";
      }
    } catch (nameError) {
      console.warn("[REMINDER-SENDER] Error getting creator name:", nameError);
      // Non-fatal error, continue with default name
    }
    
    // Format time until deadline for the email
    const timeUntilDeadline = formatReminderTime(hoursUntilDeadline);
    
    // Track the reminder attempt before sending
    try {
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: `check-in-${Date.now()}`,
        message_id: messageId,
        condition_id: conditionId,
        recipient: creatorEmail,
        delivery_channel: 'email',
        channel_order: 1,
        delivery_status: 'processing',
        response_data: { 
          type: "creator_check_in", 
          hoursUntilDeadline, 
          scheduledAt: scheduledAt 
        }
      });
    } catch (logError) {
      console.warn("[REMINDER-SENDER] Error creating delivery log:", logError);
      // Non-fatal error, continue sending
    }
    
    // Get app domain from environment or use default for button URL
    const appDomain = Deno.env.get("APP_DOMAIN") || "https://echo-vault.app";
    const messageDetailUrl = `${appDomain}/message/${messageId}`;
    
    // Construct the email with enhanced styling to match final delivery emails
    const subject = `ACTION REQUIRED: Check-in for "${messageTitle}"`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <title>Check-in Required</title>
          <style>
            @media only screen and (max-width: 620px) {
              table.body h1 {
                font-size: 28px !important;
                margin-bottom: 10px !important;
              }
              
              table.body p,
              table.body ul,
              table.body ol,
              table.body td,
              table.body span,
              table.body a {
                font-size: 16px !important;
              }
              
              table.body .wrapper,
              table.body .article {
                padding: 10px !important;
              }
              
              table.body .content {
                padding: 0 !important;
              }
              
              table.body .container {
                padding: 0 !important;
                width: 100% !important;
              }
              
              table.body .main {
                border-left-width: 0 !important;
                border-radius: 0 !important;
                border-right-width: 0 !important;
              }
              
              table.body .btn table {
                width: 100% !important;
              }
              
              table.body .btn a {
                width: 100% !important;
              }
            }
            
            @media all {
              .ExternalClass {
                width: 100%;
              }
              
              .ExternalClass,
              .ExternalClass p,
              .ExternalClass span,
              .ExternalClass font,
              .ExternalClass td,
              .ExternalClass div {
                line-height: 100%;
              }
              
              .apple-link a {
                color: inherit !important;
                font-family: inherit !important;
                font-size: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
                text-decoration: none !important;
              }
              
              #MessageViewBody a {
                color: inherit;
                text-decoration: none;
                font-size: inherit;
                font-family: inherit;
                font-weight: inherit;
                line-height: inherit;
              }
              
              .btn-primary table td:hover {
                background-color: #8b5cf6 !important;
              }
              
              .btn-primary a:hover {
                background-color: #8b5cf6 !important;
                border-color: #8b5cf6 !important;
              }
            }
          </style>
        </head>
        <body style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f6f6f6; width: 100%;" width="100%" bgcolor="#f6f6f6">
            <tr>
              <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
              <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; max-width: 580px; padding: 10px; width: 580px; margin: 0 auto;" width="580" valign="top">
                <div class="content" style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 580px; padding: 10px;">
                  <!-- START CENTERED WHITE CONTAINER -->
                  <table role="presentation" class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background: #ffffff; border-radius: 3px; width: 100%;" width="100%">
                    <!-- START MAIN CONTENT AREA -->
                    <tr>
                      <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;" valign="top">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
                          <tr>
                            <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">
                              <div style="text-align: center; margin-bottom: 24px;">
                                <!-- FIXED: Updated logo URL to directly use a reliable public URL -->
                                <img src="https://echovault-public.s3.amazonaws.com/logo-purple.png" alt="EchoVault Logo" style="width: 120px; height: auto;">
                              </div>
                              <h2 style="color: #9b87f5; font-family: sans-serif; font-weight: 700; line-height: 1.4; margin: 0; margin-bottom: 20px; font-size: 24px; text-align: center;">Check-in Required</h2>
                              <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Hello ${creatorName},</p>
                              <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">This is a reminder to check in for your message: <strong>${messageTitle}</strong>.</p>
                              <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">If you do not check in within <strong>${timeUntilDeadline}</strong>, your message will be automatically delivered.</p>
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; box-sizing: border-box; width: 100%;" width="100%">
                                <tbody>
                                  <tr>
                                    <td align="center" style="font-family: sans-serif; font-size: 14px; vertical-align: top; padding-bottom: 15px;" valign="top">
                                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: auto;">
                                        <tbody>
                                          <tr>
                                            <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; border-radius: 5px; text-align: center; background-color: #9b87f5;" valign="top" align="center" bgcolor="#9b87f5">
                                              <!-- FIXED: Added actual URL to the message detail page -->
                                              <a href="${messageDetailUrl}" target="_blank" style="border: solid 1px #9b87f5; border-radius: 5px; box-sizing: border-box; cursor: pointer; display: inline-block; font-size: 14px; font-weight: bold; margin: 0; padding: 12px 25px; text-decoration: none; text-transform: capitalize; background-color: #9b87f5; border-color: #9b87f5; color: #ffffff;">Log In To Check In</a>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Please log in to your account and check in as soon as possible.</p>
                              <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Thank you,<br>EchoVault</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- END MAIN CONTENT AREA -->
                  </table>
                  <!-- START FOOTER -->
                  <div class="footer" style="clear: both; margin-top: 10px; text-align: center; width: 100%;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
                      <tr>
                        <td class="content-block" style="font-family: sans-serif; vertical-align: top; padding-bottom: 10px; padding-top: 10px; color: #999999; font-size: 12px; text-align: center;" valign="top" align="center">
                          <span class="apple-link" style="color: #999999; font-size: 12px; text-align: center;">EchoVault - Secure Message Delivery</span>
                        </td>
                      </tr>
                    </table>
                  </div>
                  <!-- END FOOTER -->
                </div>
              </td>
              <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
            </tr>
          </table>
        </body>
      </html>
    `;
    
    // Send the email
    try {
      const emailResult = await sendEmail({
        to: creatorEmail,
        subject,
        html,
        from: "EchoVault <notifications@echo-vault.app>"
      });
      
      console.log(`[REMINDER-SENDER] Creator reminder email sent to ${creatorEmail}: ${emailResult}`);
      
      // Track the email delivery result
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: `check-in-result-${Date.now()}`,
          message_id: messageId,
          condition_id: conditionId,
          recipient: creatorEmail,
          delivery_channel: 'email',
          channel_order: 2,
          delivery_status: emailResult ? 'delivered' : 'failed',
          response_data: { 
            type: "creator_check_in_result", 
            success: emailResult,
            time: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn("[REMINDER-SENDER] Error creating delivery result log:", logError);
      }
      
      results.push({
        recipientId: userId,
        recipientEmail: creatorEmail,
        reminderType: "creator_check_in",
        success: emailResult,
        deliveryId: `check-in-${Date.now()}`
      });
      
    } catch (emailError: any) {
      console.error("[REMINDER-SENDER] Error sending creator reminder:", emailError);
      
      results.push({
        recipientId: userId,
        recipientEmail: creatorEmail,
        reminderType: "creator_check_in",
        success: false,
        error: emailError.message || "Unknown error sending email"
      });
      
      // Track the failure
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: `check-in-error-${Date.now()}`,
          message_id: messageId,
          condition_id: conditionId,
          recipient: creatorEmail,
          delivery_channel: 'email',
          channel_order: 3,
          delivery_status: 'failed',
          error_message: emailError.message || "Unknown error sending email",
          response_data: { 
            type: "creator_check_in_error",
            error: emailError.message || "Unknown error",
            time: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn("[REMINDER-SENDER] Error creating error log:", logError);
      }
    }
    
    return results;
  } catch (error: any) {
    console.error("[REMINDER-SENDER] Error in sendCreatorReminder:", error);
    
    return [{
      recipientId: userId,
      recipientEmail: "error",
      reminderType: "creator_check_in",
      success: false,
      error: error.message || "Unknown error in sendCreatorReminder"
    }];
  }
}

/**
 * Send reminders to recipients for standard reminders
 */
export async function sendRecipientReminders(
  messageId: string,
  messageTitle: string,
  creatorName: string,
  recipients: any[],
  hoursUntilDeadline: number,
  scheduledAt: string,
  debug: boolean = false,
  isFinalDelivery: boolean = false
): Promise<ReminderResult[]> {
  try {
    if (debug) {
      console.log(`[REMINDER-SENDER] Sending ${isFinalDelivery ? 'FINAL DELIVERY' : 'reminder'} for message ${messageId}`);
      console.log(`[REMINDER-SENDER] Recipients count: ${recipients.length}`);
    }
    
    const supabase = supabaseClient();
    const results: ReminderResult[] = [];
    
    // Format time until deadline for the email
    const timeUntilDeadline = formatReminderTime(hoursUntilDeadline);
    
    // Get app domain from environment or use default for button URL
    const appDomain = Deno.env.get("APP_DOMAIN") || "https://echo-vault.app";
    
    // Process each recipient
    for (const recipient of recipients) {
      const recipientEmail = recipient.email;
      const recipientName = recipient.name || "Recipient";
      const deliveryId = `delivery-${Date.now()}-${recipient.id || Math.random().toString(36).substring(2, 15)}`;
      
      if (!recipientEmail) {
        console.error(`[REMINDER-SENDER] No email for recipient ${recipient.id || 'unknown'}`);
        results.push({
          recipientId: recipient.id || "unknown",
          recipientEmail: "missing",
          reminderType: isFinalDelivery ? "final_delivery" : "standard",
          success: false,
          error: "No email address provided"
        });
        continue;
      }
      
      // Generate the access URL for the message
      const accessUrl = `${appDomain}/access/message/${encodeURIComponent(messageId)}?delivery=${encodeURIComponent(deliveryId)}&recipient=${encodeURIComponent(recipientEmail)}`;
      
      // Track the reminder attempt
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: `recipient-${Date.now()}-${results.length}`,
          message_id: messageId,
          condition_id: recipient.id || "unknown",
          recipient: recipientEmail,
          delivery_channel: 'email',
          channel_order: 1,
          delivery_status: 'processing',
          response_data: { 
            type: isFinalDelivery ? "final_delivery" : "reminder", 
            hoursUntilDeadline,
            scheduledAt
          }
        });
      } catch (logError) {
        console.warn("[REMINDER-SENDER] Error creating recipient delivery log:", logError);
        // Non-fatal, continue sending
      }
      
      // Construct the email content with modern design
      let subject, html;
      
      if (isFinalDelivery) {
        subject = `Message Delivered: "${messageTitle}" from ${creatorName}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
              <title>Message Delivered</title>
              <style>
                @media only screen and (max-width: 620px) {
                  table.body h1 {
                    font-size: 28px !important;
                    margin-bottom: 10px !important;
                  }
                  
                  table.body p,
                  table.body ul,
                  table.body ol,
                  table.body td,
                  table.body span,
                  table.body a {
                    font-size: 16px !important;
                  }
                  
                  table.body .wrapper,
                  table.body .article {
                    padding: 10px !important;
                  }
                  
                  table.body .content {
                    padding: 0 !important;
                  }
                  
                  table.body .container {
                    padding: 0 !important;
                    width: 100% !important;
                  }
                  
                  table.body .main {
                    border-left-width: 0 !important;
                    border-radius: 0 !important;
                    border-right-width: 0 !important;
                  }
                  
                  table.body .btn table {
                    width: 100% !important;
                  }
                  
                  table.body .btn a {
                    width: 100% !important;
                  }
                }
                
                @media all {
                  .ExternalClass {
                    width: 100%;
                  }
                  
                  .ExternalClass,
                  .ExternalClass p,
                  .ExternalClass span,
                  .ExternalClass font,
                  .ExternalClass td,
                  .ExternalClass div {
                    line-height: 100%;
                  }
                  
                  .apple-link a {
                    color: inherit !important;
                    font-family: inherit !important;
                    font-size: inherit !important;
                    font-weight: inherit !important;
                    line-height: inherit !important;
                    text-decoration: none !important;
                  }
                  
                  #MessageViewBody a {
                    color: inherit;
                    text-decoration: none;
                    font-size: inherit;
                    font-family: inherit;
                    font-weight: inherit;
                    line-height: inherit;
                  }
                  
                  .btn-primary table td:hover {
                    background-color: #8b5cf6 !important;
                  }
                  
                  .btn-primary a:hover {
                    background-color: #8b5cf6 !important;
                    border-color: #8b5cf6 !important;
                  }
                }
              </style>
            </head>
            <body style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f6f6f6; width: 100%;" width="100%" bgcolor="#f6f6f6">
                <tr>
                  <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
                  <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; max-width: 580px; padding: 10px; width: 580px; margin: 0 auto;" width="580" valign="top">
                    <div class="content" style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 580px; padding: 10px;">
                      <!-- START CENTERED WHITE CONTAINER -->
                      <table role="presentation" class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background: #ffffff; border-radius: 3px; width: 100%;" width="100%">
                        <!-- START MAIN CONTENT AREA -->
                        <tr>
                          <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;" valign="top">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
                              <tr>
                                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">
                                  <div style="text-align: center; margin-bottom: 24px;">
                                    <img src="https://echovault-public.s3.amazonaws.com/logo-purple.png" alt="EchoVault Logo" style="width: 120px; height: auto;">
                                  </div>
                                  <h2 style="color: #9b87f5; font-family: sans-serif; font-weight: 700; line-height: 1.4; margin: 0; margin-bottom: 20px; font-size: 24px; text-align: center;">Message Delivered</h2>
                                  <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Hello ${recipientName},</p>
                                  <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">${creatorName} has sent you a message titled: <strong>${messageTitle}</strong>.</p>
                                  <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">This message was automatically delivered because the sender did not check in within the specified timeframe.</p>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; box-sizing: border-box; width: 100%;" width="100%">
                                    <tbody>
                                      <tr>
                                        <td align="center" style="font-family: sans-serif; font-size: 14px; vertical-align: top; padding-bottom: 15px;" valign="top">
                                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: auto;">
                                            <tbody>
                                              <tr>
                                                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; border-radius: 5px; text-align: center; background-color: #9b87f5;" valign="top" align="center" bgcolor="#9b87f5">
                                                  <a href="${accessUrl}" target="_blank" style="border: solid 1px #9b87f5; border-radius: 5px; box-sizing: border-box; cursor: pointer; display: inline-block; font-size: 14px; font-weight: bold; margin: 0; padding: 12px 25px; text-decoration: none; text-transform: capitalize; background-color: #9b87f5; border-color: #9b87f5; color: #ffffff;">View Message</a>
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Or, click the link below to access the message:</p>
                                  <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;"><a href="${accessUrl}" target="_blank" style="color: #9b87f5;">${accessUrl}</a></p>
                                  <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Thank you,<br>EchoVault</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <!-- END MAIN CONTENT AREA -->
                      </table>
                      <!-- START FOOTER -->
                      <div class="footer" style="clear: both; margin-top: 10px; text-align: center; width: 100%;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
                          <tr>
                            <td class="content-block" style="font-family: sans-serif; vertical-align: top; padding-bottom: 10px; padding-top: 10px; color: #999999; font-size: 12px; text-align: center;" valign="top" align="center">
                              <span class="apple-link" style="color: #999999; font-size: 12px; text-align: center;">EchoVault - Secure Message Delivery</span>
                            </td>
                          </tr>
                        </table>
                      </div>
                      <!-- END FOOTER -->
                    </div>
                  </td>
                  <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
                </tr>
              </table>
            </body>
          </html>
        `;
      } else {
        subject = `Upcoming Message: "${messageTitle}" from ${creatorName}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
              <title>Upcoming Message Notification</title>
              <style>
                @media only screen and (max-width: 620px) {
                  table.body h1 {
                    font-size: 28px !important;
                    margin-bottom: 10px !important;
                  }
                  
                  table.body p,
                  table.body ul,
                  table.body ol,
                  table.body td,
                  table.body span,
                  table.body a {
                    font-size: 16px !important;
                  }
                  
                  table.body .wrapper,
                  table.body .article {
                    padding: 10px !important;
                  }
                  
                  table.body .content {
                    padding: 0 !important;
                  }
                  
                  table.body .container {
                    padding: 0 !important;
                    width: 100% !important;
                  }
                  
                  table.body .main {
                    border-left-width: 0 !important;
                    border-radius: 0 !important;
                    border-right-width: 0 !important;
                  }
                  
                  table.body .btn table {
                    width: 100% !important;
                  }
                  
                  table.body .btn a {
                    width: 100% !important;
                  }
                }
                
                @media all {
                  .ExternalClass {
                    width: 100%;
                  }
                  
                  .ExternalClass,
                  .ExternalClass p,
                  .ExternalClass span,
                  .ExternalClass font,
                  .ExternalClass td,
                  .ExternalClass div {
                    line-height: 100%;
                  }
                  
                  .apple-link a {
                    color: inherit !important;
                    font-family: inherit !important;
                    font-size: inherit !important;
                    font-weight: inherit !important;
                    line-height: inherit !important;
                    text-decoration: none !important;
                  }
                  
                  #MessageViewBody a {
                    color: inherit;
                    text-decoration: none;
                    font-size: inherit;
                    font-family: inherit;
                    font-weight: inherit;
                    line-height: inherit;
                  }
                  
                  .btn-primary table td:hover {
                    background-color: #8b5cf6 !important;
                  }
                  
                  .btn-primary a:hover {
                    background-color: #8b5cf6 !important;
                    border-color: #8b5cf6 !important;
                  }
                }
              </style>
            </head>
            <body style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f6f6f6; width: 100%;" width="100%" bgcolor="#f6f6f6">
                <tr>
                  <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
                  <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; max-width: 580px; padding: 10px; width: 580px; margin: 0 auto;" width="580" valign="top">
                    <div class="content" style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 580px; padding: 10px;">
                      <!-- START CENTERED WHITE CONTAINER -->
                      <table role="presentation" class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background: #ffffff; border-radius: 3px; width: 100%;" width="100%">
                        <!-- START MAIN CONTENT AREA -->
                        <tr>
                          <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;" valign="top">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
                              <tr>
                                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">
                                  <div style="text-align: center; margin-bottom: 24px;">
                                    <img src="https://echovault-public.s3.amazonaws.com/logo-purple.png" alt="EchoVault Logo" style="width: 120px; height: auto;">
                                  </div>
                                  <h2 style="color: #9b87f5; font-family: sans-serif; font-weight: 700; line-height: 1.4; margin: 0; margin-bottom: 20px; font-size: 24px; text-align: center;">Upcoming Message Notification</h2>
                                  <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Hello ${recipientName},</p>
                                  <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">This is a reminder that ${creatorName} has a message titled <strong>${messageTitle}</strong> that will be delivered to you in ${timeUntilDeadline}.</p>
                                  <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">The message will be delivered if the sender does not check in within that timeframe.</p>
                                  <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Thank you,<br>EchoVault</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <!-- END MAIN CONTENT AREA -->
                      </table>
                      <!-- START FOOTER -->
                      <div class="footer" style="clear: both; margin-top: 10px; text-align: center; width: 100%;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
                          <tr>
                            <td class="content-block" style="font-family: sans-serif; vertical-align: top; padding-bottom: 10px; padding-top: 10px; color: #999999; font-size: 12px; text-align: center;" valign="top" align="center">
                              <span class="apple-link" style="color: #999999; font-size: 12px; text-align: center;">EchoVault - Secure Message Delivery</span>
                            </td>
                          </tr>
                        </table>
                      </div>
                      <!-- END FOOTER -->
                    </div>
                  </td>
                  <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
                </tr>
              </table>
            </body>
          </html>
        `;
      }
      
      // Send the email
      try {
        const emailResult = await sendEmail({
          to: recipientEmail,
          subject,
          html,
          from: "EchoVault <notifications@echo-vault.app>"
        });
        
        if (debug) {
          console.log(`[REMINDER-SENDER] Email sent to ${recipientEmail}: ${emailResult}`);
        }
        
        // If this is a final delivery, try to track it in the delivered_messages table
        if (isFinalDelivery) {
          try {
            await supabase.from('delivered_messages').insert({
              message_id: messageId,
              recipient_id: recipient.id || null,
              delivery_id: deliveryId,
              condition_id: conditionId
            });
          } catch (deliveryTrackError) {
            console.warn("[REMINDER-SENDER] Error tracking delivery in delivered_messages:", deliveryTrackError);
            // Non-fatal error, continue
          }
        }
        
        // Track the delivery result
        try {
          await supabase.from('reminder_delivery_log').insert({
            reminder_id: `recipient-result-${Date.now()}-${results.length}`,
            message_id: messageId,
            condition_id: recipient.id || "unknown",
            recipient: recipientEmail,
            delivery_channel: 'email',
            channel_order: 2,
            delivery_status: emailResult ? 'delivered' : 'failed',
            response_data: { 
              type: isFinalDelivery ? "final_delivery_result" : "reminder_result", 
              success: emailResult,
              delivery_id: deliveryId
            }
          });
        } catch (logError) {
          console.warn("[REMINDER-SENDER] Error creating recipient result log:", logError);
        }
        
        results.push({
          recipientId: recipient.id || "unknown",
          recipientEmail,
          reminderType: isFinalDelivery ? "final_delivery" : "standard",
          success: emailResult,
          deliveryId: deliveryId
        });
        
      } catch (emailError: any) {
        console.error(`[REMINDER-SENDER] Error sending email to ${recipientEmail}:`, emailError);
        
        results.push({
          recipientId: recipient.id || "unknown",
          recipientEmail,
          reminderType: isFinalDelivery ? "final_delivery" : "standard",
          success: false,
          error: emailError.message || "Unknown error sending email"
        });
        
        // Track the failure
        try {
          await supabase.from('reminder_delivery_log').insert({
            reminder_id: `recipient-error-${Date.now()}-${results.length}`,
            message_id: messageId,
            condition_id: recipient.id || "unknown",
            recipient: recipientEmail,
            delivery_channel: 'email',
            channel_order: 3,
            delivery_status: 'failed',
            error_message: emailError.message || "Unknown error",
            response_data: { 
              type: isFinalDelivery ? "final_delivery_error" : "reminder_error", 
              error: emailError.message
            }
          });
        } catch (logError) {
          console.warn("[REMINDER-SENDER] Error creating recipient error log:", logError);
        }
      }
    }
    
    return results;
  } catch (error: any) {
    console.error("[REMINDER-SENDER] Error in sendRecipientReminders:", error);
    
    return [{
      recipientId: "error",
      recipientEmail: "error",
      reminderType: isFinalDelivery ? "final_delivery" : "standard",
      success: false,
      error: error.message || "Unknown error in sendRecipientReminders"
    }];
  }
}
