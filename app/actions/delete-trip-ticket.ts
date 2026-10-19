"use server";

import { createClient } from "@/lib/supabase/server";

export async function deleteTripTicket(
  ticketId: string
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
  const { data: profile, error: profileError } =
    await supabase
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

  // Only admins can delete trip tickets
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can delete trip tickets.",
    };
  }

  // Validate ticket ID
  if (!ticketId) {
    return {
      success: false,
      error: "Trip ticket ID is required.",
    };
  }

  // Delete trip ticket
  const { error: deleteError } = await supabase
    .from("trip_tickets")
    .delete()
    .eq("id", ticketId);

  if (deleteError) {
    return {
      success: false,
      error: deleteError.message,
    };
  }

  // Verify deletion
  const { data: deletedTicket, error: verifyError } =
    await supabase
      .from("trip_tickets")
      .select("id")
      .eq("id", ticketId)
      .maybeSingle();

  if (verifyError) {
    return {
      success: false,
      error: verifyError.message,
    };
  }

  if (deletedTicket) {
    return {
      success: false,
      error: "Trip ticket was not deleted.",
    };
  }

  return {
    success: true,
    message: "Trip ticket deleted successfully.",
  };
}