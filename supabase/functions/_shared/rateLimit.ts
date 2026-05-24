import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Checks if a user has exceeded their rate limit for a specific action.
 * If not, it logs the attempt and returns true.
 * If they have exceeded the limit, it returns false.
 * 
 * @param adminClient A Supabase client initialized with the SERVICE_ROLE_KEY
 * @param playerId The UUID of the player
 * @param action A string identifier for the action (e.g., 'make_accusation')
 * @param windowSeconds The rolling time window in seconds
 * @param maxRequests Maximum allowed requests within the window
 * @returns boolean indicating if the request is allowed
 */
export async function checkRateLimit(
  adminClient: SupabaseClient,
  playerId: string,
  action: string,
  windowSeconds: number = 3,
  maxRequests: number = 1
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
  
  const { count, error } = await adminClient
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("player_id", playerId)
    .eq("action", action)
    .gte("attempted_at", windowStart);

  if (error) {
    console.error(`Rate limit check failed for ${action}:`, error);
    // Fail closed: if we can't check the DB, we shouldn't allow the request
    return false; 
  }

  if ((count ?? 0) >= maxRequests) {
    return false; // Rate limited
  }

  // Insert the attempt
  const { error: insertError } = await adminClient
    .from("rate_limits")
    .insert({ player_id: playerId, action });
    
  if (insertError) {
    console.error(`Failed to record rate limit attempt for ${action}:`, insertError);
  }

  return true; // Allowed
}
