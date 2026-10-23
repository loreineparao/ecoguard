"use server";

import { createClient } from "@/lib/supabase/server";

export async function deleteCollectionSchedule(
  scheduleId: string
) {
  const supabase = await createClient();

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  // Check user's role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      success: false,
      error: profileError.message,
    };
  }

  if (!profile) {
    return {
      success: false,
      error: "User profile not found.",
    };
  }

  // Only admins can delete schedules
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can delete collection schedules.",
    };
  }

  if (!scheduleId) {
    return {
      success: false,
      error: "Schedule ID is required.",
    };
  }

  // Delete the schedule
  const { error: deleteError } = await supabase
    .from("collection_schedules")
    .delete()
    .eq("id", scheduleId);

  if (deleteError) {
    return {
      success: false,
      error: deleteError.message,
    };
  }

  // Verify that the schedule was deleted
  const { data: deletedSchedule, error: verifyError } =
    await supabase
      .from("collection_schedules")
      .select("id")
      .eq("id", scheduleId)
      .maybeSingle();

  if (verifyError) {
    return {
      success: false,
      error: verifyError.message,
    };
  }

  if (deletedSchedule) {
    return {
      success: false,
      error: "Schedule was not deleted.",
    };
  }

  return {
    success: true,
    message: "Collection schedule deleted successfully.",
  };
}