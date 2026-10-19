"use server";

import { createClient } from "@/lib/supabase/server";

const ALLOWED_REPORT_TYPES = [
  "Environmental Complaints Report",
  "Garbage Collection Report",
];

export async function createReport(reportType: string) {
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

  // Only admins can create reports
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can create reports.",
    };
  }

  // Validate report type
  if (!reportType || reportType.trim().length === 0) {
    return {
      success: false,
      error: "Report type is required.",
    };
  }

  const normalizedReportType = reportType.trim();

  if (!ALLOWED_REPORT_TYPES.includes(normalizedReportType)) {
    return {
      success: false,
      error:
        "Invalid report type. Only Environmental Complaints Report and Garbage Collection Report are supported.",
    };
  }

  // Create report
  const { data, error } = await supabase
    .from("reports")
    .insert({
      report_type: normalizedReportType,
      generated_by: user.id,
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
    report: data,
  };
}