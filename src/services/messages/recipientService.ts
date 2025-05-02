
import { supabaseClient } from "@/lib/supabaseClient";
import { Recipient } from "@/types/message";

// Fetch all recipients for the current user
export async function fetchRecipients(): Promise<Recipient[]> {
  const { data, error } = await supabaseClient
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
  phone?: string
): Promise<Recipient> {
  const newRecipient = {
    user_id: userId,
    name,
    email,
    phone
  };

  const { data, error } = await supabaseClient
    .from('recipients')
    .insert(newRecipient)
    .select('*')
    .single();

  if (error) {
    console.error("Error creating recipient:", error);
    throw new Error(error.message);
  }

  return data;
}

// Update an existing recipient
export async function updateRecipient(
  id: string,
  updates: { name?: string; email?: string; phone?: string }
): Promise<Recipient> {
  const { data, error } = await supabaseClient
    .from('recipients')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error("Error updating recipient:", error);
    throw new Error(error.message);
  }

  return data;
}

// Delete a recipient
export async function deleteRecipient(id: string): Promise<void> {
  const { error } = await supabaseClient
    .from('recipients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting recipient:", error);
    throw new Error(error.message);
  }
}
