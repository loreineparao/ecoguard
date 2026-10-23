"use server";

import { createClient } from "@/lib/supabase/server";

export async function getComplaintEvidence(complaintId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  // Verify that the current user is an administrator
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

  if (!profile || profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can view complaint evidence.",
    };
  }

  if (!complaintId) {
    return {
      success: false,
      error: "Complaint ID is required.",
    };
  }

  // Get evidence records for the complaint
  const { data: evidence, error: evidenceError } = await supabase
    .from("evidence")
    .select("id, complaint_id, file_url, uploaded_at")
    .eq("complaint_id", complaintId)
    .order("uploaded_at", { ascending: false });

  if (evidenceError) {
    return {
      success: false,
      error: evidenceError.message,
    };
  }

  // Create temporary signed URLs for the private storage files
  const evidenceWithUrls = await Promise.all(
    (evidence ?? []).map(async (item) => {
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("complaint-evidence")
          .createSignedUrl(item.file_url, 60 * 10);

      if (signedUrlError) {
        return {
          ...item,
          signedUrl: null,
        };
      }

      return {
        ...item,
        signedUrl: signedUrlData.signedUrl,
      };
    })
  );

  return {
    success: true,
    evidence: evidenceWithUrls,
  };
}