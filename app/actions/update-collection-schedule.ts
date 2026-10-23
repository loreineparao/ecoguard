"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateCollectionSchedule(
  scheduleId: string,
  barangay: string,
  collectionTime: string,
  truckId?: string,
  driverId?: string
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

  // Only admins can update schedules
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can update collection schedules.",
    };
  }

  // Validate input
  if (!scheduleId) {
    return {
      success: false,
      error: "Schedule ID is required.",
    };
  }

  if (!barangay || barangay.trim().length === 0) {
    return {
      success: false,
      error: "Barangay is required.",
    };
  }

  if (!collectionTime) {
    return {
      success: false,
      error: "Collection time is required.",
    };
  }

  // Update schedule
  const { error: updateError } = await supabase
    .from("collection_schedules")
    .update({
      barangay: barangay.trim(),
      collection_time: collectionTime,
      truck_id: truckId?.trim() || null,
      driver_id: driverId?.trim() || null,
    })
    .eq("id", scheduleId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  // Verify update
  const { data: updatedSchedule, error: verifyError } =
    await supabase
      .from("collection_schedules")
      .select("*")
      .eq("id", scheduleId)
      .maybeSingle();

  if (verifyError) {
    return {
      success: false,
      error: verifyError.message,
    };
  }

  if (!updatedSchedule) {
    return {
      success: false,
      error: "Collection schedule could not be found.",
    };
  }

  return {
    success: true,
    schedule: updatedSchedule,
  };
}