"use server";

import { createClient } from "@/lib/supabase/server";

export async function dispatchComplaint(
  complaintId: string,
  assignedPersonnel: string
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

  // Check user's role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return {
      success: false,
      error: profileError.message,
    };
  }

  // Only admin/MENR personnel can dispatch complaints
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only authorized MENR personnel can dispatch complaints.",
    };
  }

  // Validate assigned personnel
  if (!assignedPersonnel || assignedPersonnel.trim() === "") {
    return {
      success: false,
      error: "Assigned personnel is required.",
    };
  }

  // Update complaint
  const { data, error } = await supabase
    .from("complaints")
    .update({
      status: "Dispatched",
      assigned_personnel: assignedPersonnel.trim(),
    })
    .eq("id", complaintId)
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
    complaint: data,
  };
}