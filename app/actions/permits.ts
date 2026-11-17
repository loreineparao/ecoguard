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

  // Validate applicant name: cannot be blank or contain only whitespace
  const trimmedName = applicantName.trim();
  if (!trimmedName) {
    return {
      success: false,
      error: "Applicant full name is required and cannot be blank.",
    };
  }

  // Idempotency: prevent accidental duplicate permit submissions from rapid clicking (15s window)
  const recentWindow = new Date(Date.now() - 15 * 1000).toISOString();
  const { data: recentDuplicate } = await supabase
    .from("permit_applications")
    .select()
    .eq("user_id", user.id)
    .eq("applicant_name", trimmedName)
    .gte("submitted_at", recentWindow)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentDuplicate) {
    return {
      success: true,
      application: recentDuplicate,
      reused: true,
    };
  }

  // Submit the permit application
  const { data, error } = await supabase
    .from("permit_applications")
    .insert({
      user_id: user.id,
      applicant_name: trimmedName,
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