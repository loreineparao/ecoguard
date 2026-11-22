import { createClient } from "@supabase/supabase-js";

/**
 * Creates a server-side Supabase Admin Client using the privileged service role key.
 * Used exclusively for server-side administrative operations such as permanently deleting
 * an authentication account from auth.users after identity verification and data cleanup.
 *
 * NEVER import or invoke this function inside client components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
