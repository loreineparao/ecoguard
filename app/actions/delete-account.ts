"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// In-memory rate limiting map for reauthentication attempts: userId -> { attempts, firstAttempt }
const reauthAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(userId: string): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now();
  const entry = reauthAttempts.get(userId);

  if (!entry) {
    return { allowed: true };
  }

  // If window passed, reset
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

export type DeleteAccountInput = {
  password?: string;
  reason?: string;
  reasonOther?: string;
};

export type DeleteAccountResult = {
  success: boolean;
  error?: string;
  redirectUrl?: string;
};

/**
 * Securely deletes an authenticated resident account from EcoGuard.
 * Complies with Philippine RA 9003, PD 705, and RA 10173:
 * - Unlinks and preserves official complaints and permit records for municipal audit.
 * - Deletes user's chat history, avatar storage files, and private profile records.
 * - Permanently terminates the user's Supabase Auth credentials.
 * - Signs out and clears the session.
 */
export async function deleteOwnAccount(input: DeleteAccountInput): Promise<DeleteAccountResult> {
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

  // 2. Prevent administrative accounts from being deleted via resident self-service
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role === "admin") {
    return {
      success: false,
      error:
        "Administrator accounts cannot be self-deleted. Please contact the Municipal Human Resources Office or Municipal IT Administrator for credential decommissioning.",
    };
  }

  // 3. Verify credentials & rate limiting
  const hasPasswordProvider =
    user.app_metadata?.provider === "email" ||
    user.identities?.some((id) => id.provider === "email");

  const rateCheck = checkRateLimit(userId);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Too many unsuccessful verification attempts. For your security, please wait ${rateCheck.waitMinutes} minute(s) before trying again.`,
    };
  }

  if (hasPasswordProvider) {
    const password = input.password?.trim();
    if (!password) {
      return {
        success: false,
        error: "Current password is required to verify your identity.",
      };
    }

    // Secure re-authentication via Supabase Auth
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (signInError) {
      recordFailedAttempt(userId);
      return {
        success: false,
        error: "Incorrect password. Identity verification failed.",
      };
    }

    // Reset rate limit on successful re-authentication
    clearRateLimit(userId);
  }

  // 4. Perform Data Cleanup & Municipal Records Retention Handling
  try {
    // 4a. Clean up storage files (resident avatars)
    try {
      const { data: avatarFiles } = await supabase.storage
        .from("avatars")
        .list(userId);

      if (avatarFiles && avatarFiles.length > 0) {
        const filePaths = avatarFiles.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from("avatars").remove(filePaths);
      }
    } catch (storageErr) {
      console.warn("Notice: Avatar storage cleanup warning (continuing deletion):", storageErr);
    }

    // 4b. Chat History Cleanup (AI Assistant history)
    try {
      await supabase.from("chat_conversations").delete().eq("user_id", userId);
    } catch (chatErr) {
      console.warn("Notice: Chat conversation cleanup warning:", chatErr);
    }

    // 4c. Account Deletion Requests Cleanup
    try {
      await supabase.from("account_deletion_requests").delete().eq("user_id", userId);
    } catch (reqErr) {
      console.warn("Notice: Deletion request cleanup warning:", reqErr);
    }

    // 4d. Preserve & Anonymize Official Municipal Records (RA 9003 & PD 705)
    // Complaints: Unlink user_id so complaints, locations, and evidence remain intact for MENR inspectors
    try {
      await supabase
        .from("complaints")
        .update({ user_id: null })
        .eq("user_id", userId);
    } catch (complaintErr) {
      console.warn("Notice: Complaint unlinking warning:", complaintErr);
    }

    // Permit Applications: Unlink user_id so forestry permits remain intact for MENR auditors
    try {
      await supabase
        .from("permit_applications")
        .update({ user_id: null })
        .eq("user_id", userId);
    } catch (permitErr) {
      console.warn("Notice: Permit application unlinking warning:", permitErr);
    }

    // 4e. Delete or Anonymize public.profiles
    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      // If profiles cannot be deleted due to FK references, anonymize it thoroughly
      await supabase
        .from("profiles")
        .update({
          full_name: "Deactivated Resident",
          contact_number: null,
          address: null,
          barangay: null,
          avatar_url: null,
          email: `deleted_${userId.slice(0, 8)}@ecoguard.local`,
          deletion_status: "deleted",
        })
        .eq("id", userId);
    }

    // 5. Delete authentication account from auth.users
    let userDeleted = false;
    let deletionMethodUsed = "";

    // Method A: Supabase Admin API with SUPABASE_SERVICE_ROLE_KEY
    const adminClient = createAdminClient();
    if (adminClient) {
      const { error: adminDeleteErr } = await adminClient.auth.admin.deleteUser(userId);
      if (!adminDeleteErr) {
        userDeleted = true;
        deletionMethodUsed = "Admin API (Service Role)";
      } else {
        console.warn("Admin deleteUser warning, trying RPC fallback:", adminDeleteErr.message);
      }
    }

    // Method B: PostgreSQL SECURITY DEFINER RPC delete_own_account()
    if (!userDeleted) {
      const { data: rpcResult, error: rpcErr } = await supabase.rpc("delete_own_account");
      if (!rpcErr && rpcResult && (rpcResult as { success?: boolean }).success !== false) {
        userDeleted = true;
        deletionMethodUsed = "PostgreSQL RPC (delete_own_account)";
      } else if (rpcErr) {
        console.warn("RPC delete_own_account notice:", rpcErr.message);
      }
    }

    // CRITICAL SECURITY ENFORCEMENT:
    // If the account was NOT deleted from auth.users, do NOT return false success!
    if (!userDeleted) {
      // Mark metadata so middleware locks out the account from accessing protected routes
      await supabase.auth.updateUser({
        data: {
          account_status: "deleted",
          deleted_at: new Date().toISOString(),
          deletion_reason: input.reason || input.reasonOther || "Resident self-service deletion",
        },
      });

      // Clear session cookies to force sign out
      try {
        await supabase.auth.signOut({ scope: "global" });
      } catch {
        // Ignore signout error
      }

      return {
        success: false,
        error:
          "Account was deactivated, but permanent deletion from auth.users requires either SUPABASE_SERVICE_ROLE_KEY in .env.local or running the 'delete_own_account' SQL migration in Supabase SQL Editor. Please notify the MENR administrator.",
      };
    }

    console.log(`Account ${userId} successfully deleted from auth.users via ${deletionMethodUsed}.`);

    // 6. Sign out user with global scope and clear all session cookies
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // Ignore if user was already deleted
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
      // Cookie clearing fallback
    }

    return {
      success: true,
      redirectUrl: "/login?notice=account_deleted",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected server error occurred.";
    console.error("Account deletion process error:", errorMsg);
    return {
      success: false,
      error: `Account deletion failed: ${errorMsg}. Your account remains protected. Please try again or contact the MENR Office.`,
    };
  }
}
