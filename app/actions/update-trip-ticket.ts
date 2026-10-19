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

  // Update trip ticket
  const { error: updateError } = await supabase
    .from("trip_tickets")
    .update({
      estimated_load: estimatedLoad?.trim() || null,
      actual_collection_time:
        actualCollectionTime || null,
      driver_name: driverName.trim(),
      plate_number: plateNumber.trim(),
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