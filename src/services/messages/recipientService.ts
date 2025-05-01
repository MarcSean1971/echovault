
import { supabase } from "@/integrations/supabase/client";
import { Recipient } from "@/types/message";
import { getAuthClient } from "@/lib/supabaseClient";
import { toast } from "@/components/ui/use-toast";

export async function fetchRecipients(): Promise<Recipient[]> {
  try {
    const client = await getAuthClient();
    
    const { data, error } = await client
      .from('recipients')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) {
      console.error("Supabase error fetching recipients:", error);
      throw error;
    }
    
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
    console.log("Creating recipient with userId:", userId);
    const client = await getAuthClient();
    
    // First check if we're authenticated
    const session = await client.auth.getSession();
    console.log("Current session status:", session ? "Active" : "No session");
    
    const { data, error } = await client
      .from('recipients')
      .insert({
        user_id: userId,
        name,
        email,
        phone
      })
      .select();

    if (error) {
      console.error("Supabase error creating recipient:", error);
      if (error.message.includes('auth') || error.message.includes('permission')) {
        toast({
          title: "Authentication Error",
          description: "Your session may have expired. Please sign in again.",
          variant: "destructive"
        });
      }
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error("No data returned after creating recipient");
    }
    
    return data[0] as Recipient;
  } catch (error: any) {
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
      
    if (error) {
      console.error("Supabase error deleting recipient:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting recipient:", error);
    throw error;
  }
}
