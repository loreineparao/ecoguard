"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateComplaintStatus(
  complaintId: string,
  status: "Pending" | "Under Review" | "Dispatched" | "Resolved"
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

  // Check the user's role
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

  // Only administrators can update complaint status
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can update complaint status.",
    };
  }

  // Update complaint status
  const { error: complaintError } = await supabase
    .from("complaints")
    .update({
      status,
    })
    .eq("id", complaintId);

  if (complaintError) {
    return {
      success: false,
      error: complaintError.message,
    };
  }

  // Verify that the status was actually changed
  const { data: updatedComplaint, error: verifyError } =
    await supabase
      .from("complaints")
      .select("id, status")
      .eq("id", complaintId)
      .maybeSingle();

  if (verifyError) {
    return {
      success: false,
      error: verifyError.message,
    };
  }

  if (!updatedComplaint) {
    return {
      success: false,
      error: "Complaint could not be found after the update.",
    };
  }

  if (updatedComplaint.status !== status) {
    return {
      success: false,
      error: `Status verification failed. Database returned "${updatedComplaint.status}".`,
    };
  }

  return {
    success: true,
    message: `Complaint status successfully changed to "${updatedComplaint.status}".`,
  };
}