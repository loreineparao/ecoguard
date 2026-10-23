"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitPermitApplication(
  applicantName: string,
  documentaryRequirements: Record<string, unknown> = {}
) {
  const supabase = await createClient();

  // Check if the user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to submit a permit application.",
    };
  }

  // Validate applicant name
  if (!applicantName || applicantName.trim().length === 0) {
    return {
      success: false,
      error: "Applicant name is required.",
    };
  }

  // Submit the permit application
  const { data, error } = await supabase
    .from("permit_applications")
    .insert({
      user_id: user.id,
      applicant_name: applicantName.trim(),
      documentary_requirements: documentaryRequirements,
      application_status: "Pending",
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
    application: data,
  };
}

export async function getMyPermitApplications() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "You must be logged in to view your permit applications.",
      applications: [],
    };
  }

 const { data, error } = await supabase
  .from("permit_applications")
  .select("*")
  .eq("user_id", user.id); 

  if (error) {
    return {
      success: false,
      error: error.message,
      applications: [],
    };
  }

  return {
    success: true,
    applications: data ?? [],
  };
}