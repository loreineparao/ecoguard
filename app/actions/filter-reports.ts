"use server";

import { createClient } from "@/lib/supabase/server";

export async function filterReports(
  startDate: string,
  endDate: string,
  reportType: string = "All",
  category: string = "All"
) {
  const supabase = await createClient();

  // Check logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  // Check user role
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

  // Admin only
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can filter reports.",
    };
  }

  // Validate dates
  if (!startDate || !endDate) {
    return {
      success: false,
      error: "Start date and end date are required.",
    };
  }

  if (startDate > endDate) {
    return {
      success: false,
      error: "Start date cannot be later than end date.",
    };
  }

  const endDateTime = `${endDate}T23:59:59.999`;

  /*
   * CATEGORY FILTER
   *
   * Category filtering is handled using the
   * complaints table because complaint categories
   * are stored there.
   */

  if (
    reportType === "Environmental Complaints Report" &&
    category !== "All"
  ) {
    const {
      data: complaints,
      error: complaintsError,
    } = await supabase
      .from("complaints")
      .select(
        "id, category, description, status, created_at"
      )
      .eq("category", category)
      .gte("created_at", startDate)
      .lte("created_at", endDateTime)
      .order("created_at", {
        ascending: false,
      });

    if (complaintsError) {
      return {
        success: false,
        error: complaintsError.message,
      };
    }

    return {
      success: true,
      reports: [],
      complaints: complaints || [],
    };
  }

  /*
   * NORMAL REPORT FILTERING
   */

  let query = supabase
    .from("reports")
    .select(
      "id, report_type, generated_at, generated_by"
    )
    .gte("generated_at", startDate)
    .lte("generated_at", endDateTime);

  if (reportType !== "All") {
    query = query.eq("report_type", reportType);
  }

  const {
    data: reports,
    error: reportsError,
  } = await query.order("generated_at", {
    ascending: false,
  });

  if (reportsError) {
    return {
      success: false,
      error: reportsError.message,
    };
  }

  return {
    success: true,
    reports: reports || [],
    complaints: [],
  };
}