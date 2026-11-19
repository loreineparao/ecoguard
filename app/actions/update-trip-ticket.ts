"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateTripTicket(
  ticketId: string,
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

  // Only admins can update trip tickets
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can update trip tickets.",
    };
  }

  // Validate ticket ID
  if (!ticketId) {
    return {
      success: false,
      error: "Trip ticket ID is required.",
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

  const cleanActualTime = actualCollectionTime?.trim();
  if (!cleanActualTime) {
    return {
      success: false,
      error: "Actual collection time is required for a completed trip ticket.",
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
    if (/tons?|kg|tonnes?/i.test(rawLoad)) {
      formattedLoad = rawLoad;
    } else {
      formattedLoad = `${val} tons`;
    }
  }

  // Update trip ticket
  const { error: updateError } = await supabase
    .from("trip_tickets")
    .update({
      estimated_load: formattedLoad,
      actual_collection_time: cleanActualTime,
      driver_name: cleanDriver,
      plate_number: cleanPlate,
    })
    .eq("id", ticketId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  // Verify the update
  const { data: updatedTicket, error: verifyError } =
    await supabase
      .from("trip_tickets")
      .select("*")
      .eq("id", ticketId)
      .maybeSingle();

  if (verifyError) {
    return {
      success: false,
      error: verifyError.message,
    };
  }

  if (!updatedTicket) {
    return {
      success: false,
      error: "Trip ticket could not be found.",
    };
  }

  return {
    success: true,
    ticket: updatedTicket,
  };
}