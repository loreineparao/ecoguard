"use server";

import { createClient } from "@/lib/supabase/server";

export async function createTripTicket(
  scheduleId: string,
  estimatedLoad: string,
  actualCollectionTime: string,
  driverName: string,
  plateNumber: string
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

  // Only admins can create trip tickets
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can create trip tickets.",
    };
  }

  // Validate schedule
  if (!scheduleId) {
    return {
      success: false,
      error: "Schedule ID is required.",
    };
  }

  // Check that the schedule exists
  const { data: schedule, error: scheduleError } = await supabase
    .from("collection_schedules")
    .select("id")
    .eq("id", scheduleId)
    .maybeSingle();

  if (scheduleError) {
    return {
      success: false,
      error: scheduleError.message,
    };
  }

  if (!schedule) {
    return {
      success: false,
      error: "Collection schedule not found.",
    };
  }

  // Validate required fields
  if (!driverName || driverName.trim().length === 0) {
    return {
      success: false,
      error: "Driver name is required.",
    };
  }

  if (!plateNumber || plateNumber.trim().length === 0) {
    return {
      success: false,
      error: "Plate number is required.",
    };
  }

  // Create trip ticket
  const { data, error } = await supabase
    .from("trip_tickets")
    .insert({
      schedule_id: scheduleId,
      estimated_load: estimatedLoad?.trim() || null,
      actual_collection_time:
        actualCollectionTime || null,
      driver_name: driverName.trim(),
      plate_number: plateNumber.trim(),
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
    ticket: data,
  };
}