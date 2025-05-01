
import { supabase } from "@/integrations/supabase/client";
import { Recipient } from "@/types/message";

export async function fetchRecipients(): Promise<Recipient[]> {
  try {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { error } = await supabase
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
