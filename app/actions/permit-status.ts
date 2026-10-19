"use server";

import { createClient } from "@/lib/supabase/server";

export async function updatePermitStatus(
  applicationId: string,
  status: "Pending" | "Under Review" | "Approved" | "Rejected"
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

  // Only admins can update permit status
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can update permit status.",
    };
  }

  // Update permit status
  const { error: updateError } = await supabase
    .from("permit_applications")
    .update({
      application_status: status,
    })
    .eq("id", applicationId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  // Verify the update
  const { data: updatedApplication, error: verifyError } =
    await supabase
      .from("permit_applications")
      .select("id, application_status")
      .eq("id", applicationId)
      .maybeSingle();

  if (verifyError) {
    return {
      success: false,
      error: verifyError.message,
    };
  }

  if (!updatedApplication) {
    return {
      success: false,
      error: "Permit application could not be found.",
    };
  }

  if (updatedApplication.application_status !== status) {
    return {
      success: false,
      error: `Status verification failed. Database returned "${updatedApplication.application_status}".`,
    };
  }

  return {
    success: true,
    message: `Permit status successfully changed to "${status}".`,
  };
}