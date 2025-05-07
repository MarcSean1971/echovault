
/**
 * Format a deadline time for display
 */
export function formatDeadlineTime(deadlineISOString: string): string {
  try {
    const deadline = new Date(deadlineISOString);
    
    // Format the date in a user-friendly way
    const formattedDate = deadline.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Format the time
    const formattedTime = deadline.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `${formattedDate} at ${formattedTime}`;
  } catch (error) {
    console.error("Error formatting deadline time:", error);
    return deadlineISOString;
  }
}

/**
 * Create a Supabase client with admin privileges
 */
export function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  
  // We'll implement this in the supabase-client.ts file
  return null;
}
