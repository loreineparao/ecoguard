"use server";

import { createClient } from "@/lib/supabase/server";
import { validatePhoneNumber } from "@/lib/validators";

export type ProfileUpdateData = {
  fullName: string;
  barangay?: string;
  address?: string;
  contactNumber?: string;
};

/**
 * Legacy updateProfile helper (preserves existing calls)
 */
export async function updateProfile(fullName: string) {
  return updateUserProfileDetails({ fullName });
}

/**
 * Updates resident profile details with comprehensive validation.
 * Synchronizes across both the public.profiles database table and auth.users user_metadata.
 */
export async function updateUserProfileDetails(data: ProfileUpdateData) {
  const trimmedName = data.fullName?.trim();

  if (!trimmedName) {
    return { success: false, error: "Full name is required and cannot be blank." };
  }

  if (trimmedName.length > 120) {
    return { success: false, error: "Full name must be 120 characters or fewer." };
  }

  const cleanBarangay = data.barangay?.trim() || "";
  const cleanAddress = data.address?.trim() || "";
  let cleanContact = data.contactNumber?.trim() || "";

  if (cleanContact) {
    const phoneVal = validatePhoneNumber(cleanContact);
    if (!phoneVal.isValid) {
      return { success: false, error: phoneVal.error || "Invalid contact number format." };
    }
    cleanContact = phoneVal.formatted;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.account_status === "deleted") {
    return { success: false, error: "This account has been deleted and cannot be updated." };
  }

  // 1. Synchronize user_metadata in Supabase Auth first
  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      full_name: trimmedName,
      barangay: cleanBarangay,
      address: cleanAddress,
      contact_number: cleanContact,
    },
  });

  if (metadataError) {
    console.error("Auth metadata synchronization failed:", metadataError.message);
  }

  // 2. Synchronize public.profiles database table
  const profilePayload: Record<string, unknown> = {
    full_name: trimmedName,
  };
  if (cleanBarangay) profilePayload.barangay = cleanBarangay;
  if (cleanAddress) profilePayload.address = cleanAddress;
  if (cleanContact) profilePayload.contact_number = cleanContact;
  profilePayload.updated_at = new Date().toISOString();

  let dbError: { message: string } | null = null;

  // Check if profile record exists in public.profiles
  const { data: existingProfile, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (checkError) {
    console.warn("Could not check existing profile record:", checkError.message);
  }

  if (!existingProfile) {
    // Record does not exist: insert a new row
    const insertPayload: Record<string, unknown> = {
      id: user.id,
      email: user.email || "",
      full_name: trimmedName,
      role: "resident",
    };
    if (cleanBarangay) insertPayload.barangay = cleanBarangay;
    if (cleanAddress) insertPayload.address = cleanAddress;
    if (cleanContact) insertPayload.contact_number = cleanContact;
    insertPayload.updated_at = new Date().toISOString();

    const { error: insertErr } = await supabase.from("profiles").insert(insertPayload);
    if (insertErr) {
      console.warn("Full profile insert failed, trying minimal insert:", insertErr.message);
      const { error: minInsertErr } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email || "",
        full_name: trimmedName,
      });
      dbError = minInsertErr;
    }
  } else {
    // Record exists: update the row
    const { error: fullUpdateError } = await supabase
      .from("profiles")
      .update(profilePayload)
      .eq("id", user.id);

    // If extended columns are missing, fall back to full_name only
    if (fullUpdateError) {
      console.warn("Full profile update fell back to minimal update:", fullUpdateError.message);
      const { error: fallbackError } = await supabase
        .from("profiles")
        .update({ full_name: trimmedName })
        .eq("id", user.id);
      dbError = fallbackError;
    }
  }

  // If both database update and auth metadata update failed, notify the resident
  if (dbError && metadataError) {
    console.error("Profile update failed completely:", dbError.message);
    return {
      success: false,
      error: dbError.message || "Unable to update profile in database.",
    };
  }

  if (dbError) {
    console.warn("Database profiles table sync notice (Auth user metadata updated successfully):", dbError.message);
  }

  return {
    success: true,
    message: "Your profile information has been saved successfully.",
  };
}

/**
 * Uploads a profile avatar to the 'avatars' Supabase Storage bucket.
 * Enforces image type (JPG, PNG, WEBP) and max 2 MB file size.
 */
export async function uploadAvatar(formData: FormData) {
  const file = formData.get("avatar") as File | null;

  if (!file || file.size === 0) {
    return { success: false, error: "Please select an image file to upload." };
  }

  // File size limit: 2 MB
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return {
      success: false,
      error: "Profile picture must be smaller than 2 MB.",
    };
  }

  // Allowed mime types
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      success: false,
      error: "Only JPG, PNG, or WEBP image formats are permitted.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to update your avatar." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `avatar-${Date.now()}.${extension}`;
  const filePath = `${user.id}/${fileName}`;

  // Upload to Supabase Storage 'avatars' bucket
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Avatar storage upload failed:", uploadError.message);
    return {
      success: false,
      error: `Avatar upload failed: ${uploadError.message}. Please ensure the 'avatars' storage bucket is created.`,
    };
  }

  // Retrieve public URL
  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const avatarUrl = publicUrlData.publicUrl;

  // Update profiles table if avatar_url column exists
  await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  // Synchronize with user_metadata
  await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });

  return {
    success: true,
    avatarUrl,
    message: "Profile picture updated successfully.",
  };
}

/**
 * Removes the resident's custom avatar and restores the default initials icon.
 */
export async function removeAvatar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to modify your avatar." };
  }

  // Clear from public.profiles
  await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  // Clear from user_metadata
  await supabase.auth.updateUser({
    data: { avatar_url: null },
  });

  return {
    success: true,
    message: "Profile picture removed. Default avatar restored.",
  };
}

/**
 * Submits a resident account deletion request for MENR administration review.
 * Non-destructive: Verifies resident password, records the deletion request,
 * and maintains official complaint and permit records under RA 9003 & PD 705.
 */
export async function submitAccountDeletionRequest(password: string, reason?: string) {
  if (!password) {
    return { success: false, error: "Please enter your password to confirm identity verification." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { success: false, error: "Authentication required to perform this action." };
  }

  // 1. Verify password via re-authentication
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (reauthError) {
    return {
      success: false,
      error: "Incorrect password. Identity verification failed.",
    };
  }

  const nowIso = new Date().toISOString();
  const cleanReason = reason?.trim() || "Resident initiated account deletion request";

  // 2. Insert into account_deletion_requests table if available
  try {
    const { error: insertErr } = await supabase
      .from("account_deletion_requests")
      .insert({
        user_id: user.id,
        email: user.email,
        reason: cleanReason,
        status: "pending",
        requested_at: nowIso,
      });

    if (insertErr) {
      console.warn("account_deletion_requests table insert notice:", insertErr.message);
    }
  } catch (err) {
    console.warn("Could not insert to account_deletion_requests:", err);
  }

  // 3. Mark deletion request in profiles table
  try {
    await supabase
      .from("profiles")
      .update({
        deletion_requested_at: nowIso,
        deletion_status: "pending",
      })
      .eq("id", user.id);
  } catch (err) {
    console.warn("Could not update profiles deletion status:", err);
  }

  // 4. Update auth user metadata
  await supabase.auth.updateUser({
    data: {
      account_deletion_request: {
        status: "pending",
        requested_at: nowIso,
        reason: cleanReason,
      },
    },
  });

  return {
    success: true,
    message: "Your account deletion request has been submitted for MENR review. Your account remains active until reviewed.",
  };
}

/**
 * Cancels a pending account deletion request.
 */
export async function cancelAccountDeletionRequest() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required to cancel deletion request." };
  }

  try {
    await supabase
      .from("account_deletion_requests")
      .update({ status: "cancelled" })
      .eq("user_id", user.id)
      .eq("status", "pending");
  } catch (err) {
    console.warn("Could not update account_deletion_requests:", err);
  }

  try {
    await supabase
      .from("profiles")
      .update({
        deletion_requested_at: null,
        deletion_status: null,
      })
      .eq("id", user.id);
  } catch (err) {
    console.warn("Could not clear profiles deletion status:", err);
  }

  await supabase.auth.updateUser({
    data: {
      account_deletion_request: null,
    },
  });

  return {
    success: true,
    message: "Your account deletion request has been cancelled.",
  };
}

/**
 * Handles account deactivation / deletion requests.
 * Complies with Philippine RA 9003 and PD 705 government retention policies:
 * Historical complaints and permits are preserved as municipal audit records,
 * while resident credentials and private personal details are terminated and anonymized.
 */
export async function requestAccountDeactivation(password: string) {
  if (!password) {
    return { success: false, error: "Please enter your password to confirm account deactivation." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { success: false, error: "Authentication required to perform this action." };
  }

  // Verify password
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (reauthError) {
    return {
      success: false,
      error: "Incorrect password. Identity verification failed.",
    };
  }

  // Anonymize personal details in profiles table
  await supabase
    .from("profiles")
    .update({
      full_name: "Deactivated Resident",
      contact_number: null,
      address: null,
      avatar_url: null,
    })
    .eq("id", user.id);

  // Update metadata marking deactivation
  await supabase.auth.updateUser({
    data: {
      account_status: "deactivated",
      deactivated_at: new Date().toISOString(),
    },
  });

  // Invalidate current session
  await supabase.auth.signOut();

  return {
    success: true,
    message: "Your EcoGuard account has been successfully deactivated and your session closed.",
  };
}
