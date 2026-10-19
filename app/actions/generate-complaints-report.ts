"use server";

import { createClient } from "@/lib/supabase/server";

export async function generateComplaintsReport() {
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

  // Get all complaints
  const { data: complaints, error: complaintsError } =
    await supabase
      .from("complaints")
      .select("id, category, status, created_at");

  if (complaintsError) {
    return {
      success: false,
      error: complaintsError.message,
    };
  }

  const totalComplaints = complaints.length;

  const pendingComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Pending"
  ).length;

  const underReviewComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Under Review"
  ).length;

  const resolvedComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Resolved"
  ).length;

  // Create report record
  const { data: report, error: reportError } =
    await supabase
      .from("reports")
      .insert({
        report_type: "Environmental Complaints Report",
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
      totalComplaints,
      pendingComplaints,
      underReviewComplaints,
      resolvedComplaints,
    },
  };
}