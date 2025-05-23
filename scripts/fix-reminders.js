
// This is a script to help manually fix reminder issues when needed
// You can run this in the browser console when logged in as an admin

async function fixStuckReminders() {
  console.log("Fixing stuck reminders...");
  
  try {
    const { data, error } = await window.supabase.functions.invoke("send-reminder-emails", {
      body: {
        action: "fix-stuck",
        debug: true,
        source: "admin-console"
      }
    });
    
    if (error) {
      console.error("Error fixing reminders:", error);
      return false;
    }
    
    console.log("Fix result:", data);
    alert(`Fixed ${data.count} stuck reminders`);
    return true;
  } catch (error) {
    console.error("Exception fixing reminders:", error);
    return false;
  }
}

async function resetReminderStatus(messageId) {
  console.log(`Resetting reminder status for message ${messageId}...`);
  
  if (!messageId) {
    messageId = prompt("Enter the message ID to reset reminders for:");
    if (!messageId) return false;
  }
  
  try {
    // First fix any stuck reminders
    await fixStuckReminders();
    
    // Now reset the specific message's reminders
    const { data, error } = await window.supabase
      .from('reminder_schedule')
      .update({ 
        status: 'pending',
        retry_count: 0,
        updated_at: new Date().toISOString()
      })
      .eq('message_id', messageId);
    
    if (error) {
      console.error("Error resetting reminders:", error);
      return false;
    }
    
    console.log("Reset result:", data);
    alert(`Reset reminder status for message ${messageId}`);
    
    // Force a check for the message
    await window.supabase.functions.invoke("send-reminder-emails", {
      body: {
        messageId,
        debug: true,
        forceSend: true,
        source: "admin-reset"
      }
    });
    
    return true;
  } catch (error) {
    console.error("Exception resetting reminders:", error);
    return false;
  }
}

// Expose functions for browser console use
window.fixStuckReminders = fixStuckReminders;
window.resetReminderStatus = resetReminderStatus;

console.log("Reminder fix scripts loaded. You can use:");
console.log("- fixStuckReminders() to fix all stuck reminders");
console.log("- resetReminderStatus(messageId) to reset and check a specific message");
