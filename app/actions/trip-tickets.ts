"use server";

import { createClient } from "@/lib/supabase/server";

export async function createTripTicket(
  driverName: string,
  plateNumber: string,
  actualCollectionTime: string,
  estimatedLoad?: string,
  scheduleId?: string | null
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

  // Validate required fields
  const cleanDriver = driverName?.trim();
  if (!cleanDriver) {
    return {
      success: false,
      error: "Driver full name is required and cannot be blank.",
    };
  }

  const cleanPlate = plateNumber?.trim();
  if (!cleanPlate) {
    return {
      success: false,
      error: "Vehicle plate number is required and cannot be blank.",
    };
  }

  // Actual collection time is required because trip tickets represent completed collections
  const cleanActualTime = actualCollectionTime?.trim();
  if (!cleanActualTime) {
    return {
      success: false,
      error: "Actual collection time is required to record a completed trip ticket.",
    };
  }

  const dateObj = new Date(cleanActualTime);
  if (isNaN(dateObj.getTime())) {
    return {
      success: false,
      error: "Invalid actual collection time format.",
    };
  }

  // Validate estimated load as a nonnegative numeric value
  let formattedLoad: string | null = null;
  if (estimatedLoad && estimatedLoad.trim().length > 0) {
    const rawLoad = estimatedLoad.trim();
    const match = rawLoad.match(/^([0-9]+(?:\.[0-9]+)?)/);
    if (!match) {
      return {
        success: false,
        error: "Estimated load must be a valid non-negative number (e.g. 4.5 tons).",
      };
    }
    const val = parseFloat(match[1]);
    if (isNaN(val) || val < 0) {
      return {
        success: false,
        error: "Estimated load cannot be negative.",
      };
    }
    // Retain existing unit or default to "tons"
    if (/tons?|kg|tonnes?/i.test(rawLoad)) {
      formattedLoad = rawLoad;
    } else {
      formattedLoad = `${val} tons`;
    }
  }

  // If a scheduleId is provided, verify it exists; otherwise allow null
  let validScheduleId: string | null = null;
  if (scheduleId && scheduleId.trim()) {
    const { data: schedule, error: scheduleError } = await supabase
      .from("collection_schedules")
      .select("id")
      .eq("id", scheduleId.trim())
      .maybeSingle();

    if (scheduleError) {
      return {
        success: false,
        error: scheduleError.message,
      };
    }

    if (schedule) {
      validScheduleId = schedule.id;
    }
  }

  // Create trip ticket representing a completed collection
  const { data, error } = await supabase
    .from("trip_tickets")
    .insert({
      schedule_id: validScheduleId,
      estimated_load: formattedLoad,
      actual_collection_time: cleanActualTime,
      driver_name: cleanDriver,
      plate_number: cleanPlate,
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