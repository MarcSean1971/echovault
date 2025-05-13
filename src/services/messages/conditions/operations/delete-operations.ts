
import { getAuthClient } from "@/lib/supabaseClient";

/**
 * Deletes a message condition from the database
 */
export async function deleteConditionFromDb(conditionId: string): Promise<void> {
  const client = await getAuthClient();
  
  const { error } = await client
    .from("message_conditions")
    .delete()
    .eq("id", conditionId);

  if (error) {
    console.error("Error deleting message condition:", error);
    throw new Error(error.message || "Failed to delete message condition");
  }
}
