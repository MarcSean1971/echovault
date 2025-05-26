
/**
 * Generate check-in URL for messages
 */
export function generateCheckInUrl(messageId: string): string {
  // Use the actual app domain
  const appDomain = Deno.env.get("APP_DOMAIN") || "https://echo-vault.app";
  return `${appDomain}/messages?check-in=${messageId}`;
}
