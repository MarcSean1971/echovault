
/**
 * Generate check-in URL for messages
 */
export function generateCheckInUrl(messageId: string): string {
  // FIXED: Use the correct app domain from environment
  const appDomain = Deno.env.get("APP_DOMAIN") || "https://onwthrpgcnfydxzzmyot.supabase.co";
  return `${appDomain}/messages?check-in=${messageId}`;
}
