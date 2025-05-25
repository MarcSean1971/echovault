
import { supabase } from "@/integrations/supabase/client";
import { Recipient } from "@/types/message";

// Fetch all recipients for the current user
export async function fetchRecipients(): Promise<Recipient[]> {
  const { data, error } = await supabase
    .from('recipients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching recipients:", error);
    throw new Error(error.message);
  }

  return data || [];
}

// Create a new recipient
export async function createRecipient(
  userId: string,
  name: string,
  email: string,
  phone?: string,
  notifyOnAdd: boolean = true
): Promise<Recipient> {
  const newRecipient = {
    user_id: userId, // This is now properly typed as UUID in the database
    name,
    email,
    phone,
    notify_on_add: notifyOnAdd
  };

  const { data, error } = await supabase
    .from('recipients')
    .insert(newRecipient)
    .select('*')
    .single();

  if (error) {
    console.error("Error creating recipient:", error);
    throw new Error(error.message);
  }

  // If notify_on_add is true, send the welcome email
  if (notifyOnAdd) {
    try {
      await sendWelcomeEmail(name, email);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Continue despite email error - the recipient was created successfully
    }
  }

  return data;
}

// Update an existing recipient
export async function updateRecipient(
  id: string,
  updates: { 
    name?: string; 
    email?: string; 
    phone?: string;
    notify_on_add?: boolean; 
  }
): Promise<Recipient> {
  // Get the current recipient to check if email has changed
  const { data: currentRecipient, error: fetchError } = await supabase
    .from('recipients')
    .select('email, notify_on_add')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error("Error fetching current recipient:", fetchError);
    throw new Error(fetchError.message);
  }

  const { data, error } = await supabase
    .from('recipients')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error("Error updating recipient:", error);
    throw new Error(error.message);
  }

  // If email changed and notify_on_add is true, send welcome email
  const emailChanged = updates.email && updates.email !== currentRecipient.email;
  const shouldNotify = updates.notify_on_add !== undefined ? updates.notify_on_add : currentRecipient.notify_on_add;
  
  if (emailChanged && shouldNotify && updates.email) {
    try {
      await sendWelcomeEmail(updates.name || data.name, updates.email);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Continue despite email error - the recipient was updated successfully
    }
  }

  return data;
}

// Delete a recipient
export async function deleteRecipient(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting recipient:", error);
    throw new Error(error.message);
  }
}

// Send welcome email to new recipient
async function sendWelcomeEmail(recipientName: string, recipientEmail: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-test-email', {
    body: {
      recipientName,
      recipientEmail,
      senderName: 'EchoVault',
      messageTitle: 'Welcome to EchoVault',
      appName: 'EchoVault',
      isWelcomeEmail: true
    }
  });

  if (error) {
    console.error("Error sending welcome email:", error);
    throw new Error(error.message);
  }
}
