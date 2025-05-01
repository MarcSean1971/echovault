
import { supabase } from "@/integrations/supabase/client";
import { Recipient } from "@/types/message";
import { getAuthClient } from "@/lib/supabaseClient";

export async function fetchRecipients(): Promise<Recipient[]> {
  try {
    const client = await getAuthClient();
    
    const { data, error } = await client
      .from('recipients')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) throw error;
    
    return data as Recipient[];
  } catch (error) {
    console.error("Error fetching recipients:", error);
    throw error;
  }
}

export async function createRecipient(
  userId: string,
  name: string,
  email: string,
  phone?: string
): Promise<Recipient> {
  try {
    const client = await getAuthClient();
    
    const { data, error } = await client
      .from('recipients')
      .insert({
        user_id: userId,
        name,
        email,
        phone
      })
      .select();

    if (error) throw error;
    
    return data[0] as Recipient;
  } catch (error) {
    console.error("Error creating recipient:", error);
    throw error;
  }
}

export async function deleteRecipient(id: string): Promise<boolean> {
  try {
    const client = await getAuthClient();
    
    const { error } = await client
      .from('recipients')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error deleting recipient:", error);
    throw error;
  }
}
