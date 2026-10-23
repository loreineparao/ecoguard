"use server";

import { createClient } from "@/lib/supabase/server";

export async function generateCollectionReport() {
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

  // Only admins can generate reports
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can generate reports.",
    };
  }

  // Get collection schedules
  const {
    data: schedules,
    error: schedulesError,
  } = await supabase
    .from("collection_schedules")
    .select(
      "id, barangay, collection_time, truck_id, driver_id"
    );

  if (schedulesError) {
    return {
      success: false,
      error: schedulesError.message,
    };
  }

  const totalSchedules = schedules.length;

  // Get unique barangays
  const uniqueBarangays = new Set(
    schedules.map((schedule) => schedule.barangay)
  );

  const totalBarangays = uniqueBarangays.size;

  // Count assigned trucks
  const assignedTrucks = schedules.filter(
    (schedule) =>
      schedule.truck_id &&
      schedule.truck_id.trim().length > 0
  ).length;

  // Count assigned drivers
  const assignedDrivers = schedules.filter(
    (schedule) =>
      schedule.driver_id &&
      schedule.driver_id.trim().length > 0
  ).length;

  // Count unassigned trucks
  const unassignedTrucks =
    totalSchedules - assignedTrucks;

  // Count unassigned drivers
  const unassignedDrivers =
    totalSchedules - assignedDrivers;

  // Save report record
  const { data: report, error: reportError } =
    await supabase
      .from("reports")
      .insert({
        report_type:
          "Garbage Collection Schedule Report",
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
      totalSchedules,
      totalBarangays,
      assignedTrucks,
      assignedDrivers,
      unassignedTrucks,
      unassignedDrivers,
    },
  };
}