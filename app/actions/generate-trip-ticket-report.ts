"use server";

import { createClient } from "@/lib/supabase/server";

export async function generateTripTicketReport() {
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

  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can generate reports.",
    };
  }

  const { data: tickets, error: ticketsError } =
    await supabase
      .from("trip_tickets")
      .select(
        "id, schedule_id, estimated_load, actual_collection_time, driver_name, plate_number, created_at"
      );

  if (ticketsError) {
    return {
      success: false,
      error: ticketsError.message,
    };
  }

  const totalTickets = tickets.length;

  const completedCollections = tickets.filter(
    (ticket) => ticket.actual_collection_time
  ).length;

  const pendingCollections =
    totalTickets - completedCollections;

  const assignedDrivers = tickets.filter(
    (ticket) =>
      ticket.driver_name &&
      ticket.driver_name.trim().length > 0
  ).length;

  const assignedVehicles = tickets.filter(
    (ticket) =>
      ticket.plate_number &&
      ticket.plate_number.trim().length > 0
  ).length;

  const { data: report, error: reportError } =
    await supabase
      .from("reports")
      .insert({
        report_type: "Garbage Collection Trip Ticket Report",
        generated_by: user.id,
      })
      .select()
      .single();

  if (reportError) {
    return {
      success: false,
      error: reportError.message,
    };
  }

  return {
    success: true,
    report,
    summary: {
      totalTickets,
      completedCollections,
      pendingCollections,
      assignedDrivers,
      assignedVehicles,
    },
  };
}