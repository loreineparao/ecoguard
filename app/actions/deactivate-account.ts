"use server";

import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// In-memory rate limiting map for reauthentication attempts: userId -> { count, firstAttempt }
const reauthAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(userId: string): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now();
  const entry = reauthAttempts.get(userId);

  if (!entry) {
    return { allowed: true };
  }

  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    reauthAttempts.delete(userId);
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const remainingMs = RATE_LIMIT_WINDOW_MS - (now - entry.firstAttempt);
    const waitMinutes = Math.ceil(remainingMs / (60 * 1000));
    return { allowed: false, waitMinutes };
  }

  return { allowed: true };
}

function recordFailedAttempt(userId: string) {
  const now = Date.now();
  const entry = reauthAttempts.get(userId);
  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    reauthAttempts.set(userId, { count: 1, firstAttempt: now });
  } else {
    entry.count += 1;
  }
}

function clearRateLimit(userId: string) {
  reauthAttempts.delete(userId);
}

export type DeactivateAccountInput = {
  password: string;
  reason?: string;
  reasonOther?: string;
};

export type DeactivateAccountResult = {
  success: boolean;
  error?: string;
  redirectUrl?: string;
};

/**
 * Securely deactivates an authenticated resident's account.
 * 
 * Government & Database Preservation Guarantees:
 * - Does NOT delete rows from auth.users or public.profiles.
 * - Does NOT alter or unlink official complaints, permit applications, evidence, or locations.
 * - Preserves all 12 foreign-key relationships and capstone ERD structure.
 * - Bans user in GoTrue engine (ban_duration: '876000h' -> 100 years) so future logins and token refreshes are rejected.
 * - Sets trusted app_metadata.account_status = 'deactivated' (server-only, cannot be forged).
 * - Updates public.profiles.deletion_status = 'deactivated' and deletion_requested_at = now() via Admin Client.
 * - Explicitly verifies persisted values in both auth.users and public.profiles before reporting success.
 * - Does NOT automatically reactivate or lift bans if a profile update fails; provides safe partial state recovery.
 * - Revokes active sessions globally and clears authentication cookies.
 */
export async function deactivateOwnAccount(
  input: DeactivateAccountInput
): Promise<DeactivateAccountResult> {
  const supabase = await createClient();

  // 1. Verify authenticated user identity on the server
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    return {
      success: false,
      error: "Authentication required. Please sign in again to proceed.",
    };
  }

  const userId = user.id;

  // 2. Validate Admin Client presence upfront
  const adminClient = createAdminClient();
  if (!adminClient) {
    return {
      success: false,
      error:
        "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing from .env.local. The GoTrue Auth Admin API requires the service role key to ban the account and update government audit records.",
    };
  }

  // 3. Enforce role validation: reject administrators and non-residents
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, role, deletion_status, deletion_requested_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr) {
    return {
      success: false,
      error: "Unable to verify account profile. Please try again later.",
    };
  }

  if (profile?.role === "admin") {
    return {
      success: false,
      error:
        "Administrator accounts cannot be deactivated through the resident portal. Please contact the Municipal HR Office or Municipal IT Administrator.",
    };
  }

  if (!profile || profile.role !== "resident") {
    return {
      success: false,
      error:
        "Only registered resident accounts are eligible for self-service account deactivation.",
    };
  }

  // Check if account is ALREADY completely deactivated
  const isProfileAlreadyDeactivated = profile.deletion_status === "deactivated";
  const isAuthAlreadyBanned = Boolean(user.banned_until && new Date(user.banned_until) > new Date());
  const isAuthAlreadyDeactivated = user.app_metadata?.account_status === "deactivated";

  if (isProfileAlreadyDeactivated && isAuthAlreadyBanned && isAuthAlreadyDeactivated) {
    return {
      success: false,
      error: "This account has already been completely deactivated.",
    };
  }

  // 4. Server-side password verification
  // Rate limiting check
  const rateCheck = checkRateLimit(userId);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Too many unsuccessful verification attempts. For your security, please wait ${rateCheck.waitMinutes} minute(s) before trying again.`,
    };
  }

  const password = input.password?.trim();
  if (!password) {
    return {
      success: false,
      error: "Current password is required to confirm account deactivation.",
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return {
      success: false,
      error: "Server configuration error: Supabase client parameters are missing.",
    };
  }

  // Use an isolated stateless client to verify password without corrupting session cookies
  const verifyClient = createSupabaseClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error: signInError } = await verifyClient.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (signInError) {
    // If the account was already partially banned, GoTrue may return "User is banned"
    const isBanErr = signInError.message.toLowerCase().includes("banned");
    if (!isBanErr) {
      recordFailedAttempt(userId);
      return {
        success: false,
        error: "Incorrect password. Identity verification failed.",
      };
    }
    // If error was that user is banned, credential verification was bypassed because account is already banned
  }

  clearRateLimit(userId);

  const nowIso = new Date().toISOString();
  const deactivationReason =
    input.reason === "Other (optional explanation)"
      ? input.reasonOther?.trim() || "Other reason"
      : input.reason?.trim() || "Resident requested deactivation";

  // 5. Retrieve existing user app_metadata to preserve unrelated metadata
  const { data: userData, error: getUserErr } = await adminClient.auth.admin.getUserById(userId);
  if (getUserErr || !userData?.user) {
    return {
      success: false,
      error: `Failed to retrieve user authentication details: ${getUserErr?.message || "User not found"}`,
    };
  }

  const existingAppMetadata = userData.user.app_metadata || {};

  // 6. Step A: Apply GoTrue Ban and set server-only app_metadata
  const { data: updatedAuthUser, error: adminUpdateErr } =
    await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: "876000h", // 100-year ban: blocks signIn, token refreshes, and password resets
      app_metadata: {
        ...existingAppMetadata,
        account_status: "deactivated",
        deactivated_at: nowIso,
        deactivation_reason: deactivationReason,
      },
    });

  if (adminUpdateErr || !updatedAuthUser?.user) {
    console.error("Admin updateUserById error:", adminUpdateErr?.message);
    return {
      success: false,
      error: `Unable to ban authentication credentials: ${adminUpdateErr?.message || "Auth update failed"}.`,
    };
  }

  // 7. Step B: Update public.profiles status via Admin Client
  let profileUpdateSuccess = false;
  let profileErrorMessage = "";

  const { data: updatedProfile, error: profileUpdateErr } = await adminClient
    .from("profiles")
    .update({
      deletion_status: "deactivated",
      deletion_requested_at: nowIso,
    })
    .eq("id", userId)
    .select("id, deletion_status, deletion_requested_at")
    .maybeSingle();

  if (profileUpdateErr) {
    console.error("Profiles deletion_status update error:", profileUpdateErr.message, profileUpdateErr.code);
    profileErrorMessage = profileUpdateErr.message;
  } else if (updatedProfile && updatedProfile.deletion_status === "deactivated") {
    profileUpdateSuccess = true;
  }

  // If service_role update returned permission denied (PostgreSQL error 42501),
  // DO NOT roll back or lift the auth ban!
  // Instead, report exact diagnosis so user can execute the missing grant in Supabase SQL Editor.
  if (!profileUpdateSuccess) {
    const hint =
      profileUpdateErr?.code === "42501"
        ? " PostgreSQL error 42501 (permission denied for table profiles). Please run: GRANT ALL ON TABLE public.profiles TO service_role; in Supabase SQL Editor."
        : "";

    return {
      success: false,
      error: `Authentication credentials have been banned and marked deactivated, but updating public.profiles failed: ${profileErrorMessage || "No profile row updated."}.${hint} The account remains locked out for security.`,
    };
  }

  // 8. Step C: Explicit verification of actual persisted values before reporting success
  const { data: verifyAuthData, error: verifyAuthErr } =
    await adminClient.auth.admin.getUserById(userId);

  if (verifyAuthErr || !verifyAuthData?.user) {
    return {
      success: false,
      error: "Verification failed: Could not re-read user authentication record.",
    };
  }

  const isBanned = Boolean(
    verifyAuthData.user.banned_until && new Date(verifyAuthData.user.banned_until) > new Date()
  );
  const isAuthDeactivated = verifyAuthData.user.app_metadata?.account_status === "deactivated";
  const isProfileDeactivated = updatedProfile?.deletion_status === "deactivated";

  if (!isBanned || !isAuthDeactivated || !isProfileDeactivated) {
    return {
      success: false,
      error: `Verification incomplete: banActive=${isBanned}, authMetadata=${isAuthDeactivated}, profile=${isProfileDeactivated}. The account remains restricted.`,
    };
  }

  // 9. Invalidate sessions and refresh tokens globally
  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    // Ignore signout error if session already revoked
  }

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    for (const c of allCookies) {
      if (c.name.includes("sb-") || c.name.includes("auth") || c.name.includes("supabase")) {
        cookieStore.delete(c.name);
      }
    }
  } catch {
    // Cookie store fallback
  }

  return {
    success: true,
    redirectUrl: "/login?notice=account_deactivated",
  };
}
