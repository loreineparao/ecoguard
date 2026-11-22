"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadEvidence(
  complaintId: string,
  file: File
) {
  const supabase = await createClient();

  // 1. Check the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to upload evidence.",
    };
  }

  // 2. Check that the complaint belongs to this user
  const { data: complaint, error: complaintError } = await supabase
    .from("complaints")
    .select("id")
    .eq("id", complaintId)
    .eq("user_id", user.id)
    .single();

  if (complaintError || !complaint) {
    return {
      success: false,
      error: "Complaint not found or you do not have permission to upload evidence.",
    };
  }

  // 3. Check that a file was provided
  if (!file || file.size === 0) {
    return {
      success: false,
      error: "Please select a file.",
    };
  }

  // 4. Limit the file size to 5 MB
  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      error: "File size must be 5 MB or smaller.",
    };
  }

  // 5. Allow common image formats
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "Only JPG, PNG, and WEBP images are allowed.",
    };
  }

  // 6. Create a unique file name
  const fileExtension = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

  // 7. Create the secure Storage path
  const filePath = `${user.id}/${complaintId}/${fileName}`;

  // 8. Upload the file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("complaint-evidence")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return {
      success: false,
      error: uploadError.message,
    };
  }

  // 9. Save the file information in the evidence table
  const { data: evidence, error: evidenceError } = await supabase
    .from("evidence")
    .insert({
      complaint_id: complaintId,
      file_url: filePath,
    })
    .select()
    .single();

  // 10. If database insert fails, remove the uploaded file
  if (evidenceError) {
    await supabase.storage
      .from("complaint-evidence")
      .remove([filePath]);

    return {
      success: false,
      error: evidenceError.message,
    };
  }

  return {
    success: true,
    evidence,
    filePath,
  };
}

export async function getMyComplaintEvidence(complaintId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in.",
      evidence: [],
    };
  }

  if (!complaintId?.trim()) {
    return {
      success: false,
      error: "Complaint ID is required.",
      evidence: [],
    };
  }

  // Verify that account is not deactivated
  const { data: profile } = await supabase
    .from("profiles")
    .select("deletion_status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profile?.deletion_status === "deactivated" ||
    profile?.deletion_status === "deleted" ||
    user.app_metadata?.account_status === "deactivated"
  ) {
    return {
      success: false,
      error: "Your account has been deactivated. Access to complaint evidence is restricted.",
      evidence: [],
    };
  }

  // Verify that this complaint belongs to the logged-in resident.
  const { data: complaint, error: complaintError } = await supabase
    .from("complaints")
    .select("id")
    .eq("id", complaintId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (complaintError || !complaint) {
    return {
      success: false,
      error: "Complaint not found or you do not have permission to view its evidence.",
      evidence: [],
    };
  }

  // Retrieve evidence attached to this resident's complaint.
  const { data, error } = await supabase
    .from("evidence")
    .select("id, complaint_id, file_url, uploaded_at")
    .eq("complaint_id", complaintId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return {
      success: false,
      error: error.message,
      evidence: [],
    };
  }

  // Generate temporary links for the private files.
  const evidence = await Promise.all(
    (data ?? []).map(async (item) => {
      const { data: signedData, error: signedError } =
        await supabase.storage
          .from("complaint-evidence")
          .createSignedUrl(item.file_url, 60 * 10);

      return {
        ...item,
        signedUrl: signedError ? null : signedData.signedUrl,
      };
    })
  );

  return {
    success: true,
    evidence,
  };
}