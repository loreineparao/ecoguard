"use server";

import { createClient } from "@/lib/supabase/server";

export async function generatePermitsReport() {
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

  // Get all permit applications
  const {
    data: applications,
    error: applicationsError,
  } = await supabase
    .from("permit_applications")
    .select(
      "id, applicant_name, application_status, submitted_at"
    );

  if (applicationsError) {
    return {
      success: false,
      error: applicationsError.message,
    };
  }

  const totalApplications = applications.length;

  const pendingApplications = applications.filter(
    (application) =>
      application.application_status === "Pending"
  ).length;

  const underReviewApplications =
    applications.filter(
      (application) =>
        application.application_status ===
        "Under Review"
    ).length;

  const approvedApplications = applications.filter(
    (application) =>
      application.application_status === "Approved"
  ).length;

  const rejectedApplications = applications.filter(
    (application) =>
      application.application_status === "Rejected"
  ).length;

  // Save report record
  const { data: report, error: reportError } =
    await supabase
      .from("reports")
      .insert({
        report_type:
          "Tree Cutting Permit Applications Report",
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
      totalApplications,
      pendingApplications,
      underReviewApplications,
      approvedApplications,
      rejectedApplications,
    },
  };
}