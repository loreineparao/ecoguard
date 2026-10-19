"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadPermitDocument(
  applicationId: string,
  file: File
) {
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

  if (!applicationId) {
    return {
      success: false,
      error: "Permit application ID is required.",
    };
  }

  if (!file || file.size === 0) {
    return {
      success: false,
      error: "A document is required.",
    };
  }

  // Maximum file size: 5 MB
  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      error: "File size must not exceed 5 MB.",
    };
  }

  // Allowed document types
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "Only PDF, JPG, PNG, and WEBP files are allowed.",
    };
  }

  // Verify that the permit application exists
  const { data: application, error: applicationError } =
    await supabase
      .from("permit_applications")
      .select("id, user_id")
      .eq("id", applicationId)
      .maybeSingle();

  if (applicationError) {
    return {
      success: false,
      error: applicationError.message,
    };
  }

  if (!application) {
    return {
      success: false,
      error: "Permit application not found.",
    };
  }

  // Make sure the logged-in resident owns the application
  if (application.user_id !== user.id) {
    return {
      success: false,
      error:
        "You do not have permission to upload documents for this application.",
    };
  }

  const fileExtension =
    file.name.split(".").pop()?.toLowerCase() || "file";

  const filePath =
    `${user.id}/${applicationId}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

  // Upload file to private Supabase Storage bucket
  const { error: uploadError } = await supabase.storage
    .from("permit-documents")
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

  // Save document information in the database
  const { data: document, error: documentError } =
    await supabase
      .from("permit_documents")
      .insert({
        application_id: applicationId,
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        content_type: file.type,
      })
      .select()
      .single();

  // If database record creation fails,
  // remove the uploaded file to avoid an orphaned file.
  if (documentError) {
    await supabase.storage
      .from("permit-documents")
      .remove([filePath]);

    return {
      success: false,
      error: documentError.message,
    };
  }

  return {
    success: true,
    message: "Permit document uploaded successfully.",
    document,
    filePath,
  };
}