"use server";

import { createClient } from "@/lib/supabase/server";

type PermitDocument = {
  id: string;
  application_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  content_type: string;
  uploaded_at: string;
  signed_url: string | null;
  url_error?: string;
};

type GetPermitDocumentsResult =
  | {
      success: true;
      documents: PermitDocument[];
    }
  | {
      success: false;
      error: string;
    };

export async function getPermitDocuments(
  applicationId: string
): Promise<GetPermitDocumentsResult> {
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

  // Only authorized MENR personnel can access all permit documents
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only authorized MENR personnel can view permit documents.",
    };
  }

  if (!applicationId) {
    return {
      success: false,
      error: "Permit application ID is required.",
    };
  }

  // Get document records
  const { data: documents, error: documentsError } = await supabase
    .from("permit_documents")
    .select(
      "id, application_id, user_id, file_name, file_path, content_type, uploaded_at"
    )
    .eq("application_id", applicationId)
    .order("uploaded_at", { ascending: false });

  if (documentsError) {
    return {
      success: false,
      error: documentsError.message,
    };
  }

  // Create secure temporary URLs for the private files
  const documentsWithUrls = await Promise.all(
    (documents || []).map(async (document) => {
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("permit-documents")
          .createSignedUrl(document.file_path, 60 * 10);

      if (signedUrlError) {
        return {
          ...document,
          signed_url: null,
          url_error: signedUrlError.message,
        };
      }

      return {
        ...document,
        signed_url: signedUrlData.signedUrl,
      };
    })
  );

  return {
    success: true,
    documents: documentsWithUrls,
  };
}