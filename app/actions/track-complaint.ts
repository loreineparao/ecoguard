"use server";

import { createClient } from "@/lib/supabase/server";

export async function trackComplaint(complaintId: string) {
  const normalizedId = complaintId.trim();

  if (!normalizedId) {
    return { success: false as const, error: "Enter your report ID to continue." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { success: false as const, error: authError.message };
  }

  if (!user) {
    return {
      success: false as const,
      error: "Sign in to view the status of your report.",
      signInRequired: true,
    };
  }

  const { data, error } = await supabase
    .from("complaints")
    .select("id, status")
    .eq("id", normalizedId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { success: false as const, error: error.message };
  }

  if (!data) {
    return {
      success: false as const,
      error: "We couldn't find that report in your account. Check the ID and try again.",
    };
  }

  return { success: true as const, status: data.status };
}
