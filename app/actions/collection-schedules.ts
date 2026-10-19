"use server";

import { createClient } from "@/lib/supabase/server";

export async function createCollectionSchedule(
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

  // Only admins can create collection schedules
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can create collection schedules.",
    };
  }

  // Validate barangay
  if (!barangay || barangay.trim().length === 0) {
    return {
      success: false,
      error: "Barangay is required.",
    };
  }

  // Validate collection time
  if (!collectionTime) {
    return {
      success: false,
      error: "Collection time is required.",
    };
  }

  // Create collection schedule
  const { data, error } = await supabase
    .from("collection_schedules")
    .insert({
      barangay: barangay.trim(),
      collection_time: collectionTime,
      truck_id: truckId?.trim() || null,
      driver_id: driverId?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    schedule: data,
  };
}

export async function updateCollectionSchedule(
  scheduleId: string,
  barangay: string,
  collectionTime: string,
  truckId?: string,
  driverId?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

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

  if (!profile || profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can update collection schedules.",
    };
  }

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

  const { error } = await supabase
    .from("collection_schedules")
    .update({
      barangay: barangay.trim(),
      collection_time: collectionTime,
      truck_id: truckId?.trim() || null,
      driver_id: driverId?.trim() || null,
    })
    .eq("id", scheduleId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Collection schedule updated successfully.",
  };
}


export async function deleteCollectionSchedule(
  scheduleId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

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

  if (!profile || profile.role !== "admin") {
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

  const { error } = await supabase
    .from("collection_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Collection schedule deleted successfully.",
  };
}