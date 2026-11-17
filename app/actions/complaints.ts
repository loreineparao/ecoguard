"use server";

import { createClient } from "@/lib/supabase/server";
import { uploadEvidence } from "@/app/actions/evidence";
import { saveComplaintLocation } from "@/app/actions/locations";

export async function createComplaint(
  category: string,
  description: string
) {
  const supabase = await createClient();

  // Get the currently logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Make sure the user is logged in
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to create a complaint.",
    };
  }

  if (category !== "Illegal Dumping") {
    return {
      success: false,
      error: "The only supported complaint category is Illegal Dumping.",
    };
  }

  const trimmedDesc = description.trim();
  if (!trimmedDesc) {
    return {
      success: false,
      error: "Please provide a description of the environmental incident.",
    };
  }

  // Idempotency: prevent accidental duplicate records from rapid clicking (15s window)
  const recentWindow = new Date(Date.now() - 15 * 1000).toISOString();
  const { data: recentDuplicate } = await supabase
    .from("complaints")
    .select()
    .eq("user_id", user.id)
    .eq("category", category)
    .eq("description", trimmedDesc)
    .gte("created_at", recentWindow)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentDuplicate) {
    return {
      success: true,
      complaint: recentDuplicate,
      reused: true,
    };
  }

  // Create the complaint
  const { data, error } = await supabase
    .from("complaints")
    .insert({
      user_id: user.id,
      category: category,
      description: trimmedDesc,
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
    complaint: data,
  };
}

export type SubmitComplaintResult =
  | {
      success: true;
      complaintId: string;
      message: string;
      partial?: false;
    }
  | {
      success: false;
      complaintId?: string;
      error: string;
      partial?: boolean;
    };

/**
 * Unified, idempotent complaint submission server action.
 * Handles complaint record creation/reuse, photo evidence upload, and GPS location
 * in an atomic workflow that eliminates multiple round-trips from mobile Safari.
 */
export async function submitFullComplaint(
  formData: FormData
): Promise<SubmitComplaintResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to submit a complaint.",
    };
  }

  const category = (formData.get("category") as string) || "Illegal Dumping";
  const description = ((formData.get("description") as string) || "").trim();
  const existingComplaintId = (formData.get("complaintId") as string) || null;
  const latStr = formData.get("latitude") as string | null;
  const lngStr = formData.get("longitude") as string | null;
  const address = (formData.get("address") as string) || null;
  const evidenceFile = formData.get("evidence") as File | null;

  if (category !== "Illegal Dumping") {
    return {
      success: false,
      error: "The only supported complaint category is Illegal Dumping.",
    };
  }

  if (!description) {
    return {
      success: false,
      error: "Please describe the environmental incident.",
    };
  }

  let complaintId = existingComplaintId;

  // 1. Reuse existing complaint if provided (partial failure retry), or create new with duplicate check
  if (complaintId) {
    const { data: verified, error: verifyErr } = await supabase
      .from("complaints")
      .select("id")
      .eq("id", complaintId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (verifyErr || !verified) {
      complaintId = null; // Stale ID, fall through to create
    }
  }

  if (!complaintId) {
    // Check for recent duplicate to prevent concurrent double-clicks
    const recentWindow = new Date(Date.now() - 15 * 1000).toISOString();
    const { data: recentDuplicate } = await supabase
      .from("complaints")
      .select("id")
      .eq("user_id", user.id)
      .eq("category", category)
      .eq("description", description)
      .gte("created_at", recentWindow)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentDuplicate) {
      complaintId = recentDuplicate.id;
    } else {
      const { data: newComplaint, error: createError } = await supabase
        .from("complaints")
        .insert({
          user_id: user.id,
          category,
          description,
        })
        .select()
        .single();

      if (createError || !newComplaint) {
        return {
          success: false,
          error: createError?.message || "Failed to create complaint record.",
        };
      }

      complaintId = newComplaint.id;
    }
  }

  if (!complaintId) {
    return {
      success: false,
      error: "Unable to determine complaint ID.",
    };
  }

  const finalComplaintId: string = complaintId;

  // 2. Save location if coordinates provided
  if (latStr && lngStr) {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const locationRes = await saveComplaintLocation(
        finalComplaintId,
        lat,
        lng,
        address
      );

      if (!locationRes.success) {
        // Location failed, but complaint exists. Report partial error so user can retry without duplicate.
        return {
          success: false,
          partial: true,
          complaintId: finalComplaintId,
          error: `Complaint record #${finalComplaintId.slice(0, 8)} created, but location could not be saved: ${locationRes.error}. Tap 'Retry Submission' to finalize.`,
        };
      }
    }
  }

  // 3. Upload evidence photo if provided
  if (evidenceFile && evidenceFile.size > 0 && evidenceFile.name !== "undefined") {
    // Check if evidence already exists for this complaint
    const { data: existingEv } = await supabase
      .from("evidence")
      .select("id")
      .eq("complaint_id", finalComplaintId)
      .maybeSingle();

    if (!existingEv) {
      const uploadRes = await uploadEvidence(finalComplaintId, evidenceFile);
      if (!uploadRes.success) {
        return {
          success: false,
          partial: true,
          complaintId: finalComplaintId,
          error: `Complaint record #${finalComplaintId.slice(0, 8)} created, but photo evidence could not be uploaded: ${uploadRes.error}. Tap 'Retry Submission' to upload photo.`,
        };
      }
    }
  }

  return {
    success: true,
    complaintId: finalComplaintId,
    message: evidenceFile && evidenceFile.size > 0
      ? "Illegal dumping complaint and supporting photo submitted successfully."
      : "Illegal dumping complaint submitted successfully.",
  };
}
