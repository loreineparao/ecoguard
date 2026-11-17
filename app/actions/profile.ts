"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateProfile(fullName: string) {
  const trimmedName = fullName.trim();

  if (!trimmedName) {
    return { success: false, error: "Full name is required." };
  }

  if (trimmedName.length > 120) {
    return { success: false, error: "Full name must be 120 characters or fewer." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to update your profile." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: trimmedName })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update failed:", error.message);
    return { success: false, error: "Unable to update your profile right now." };
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { full_name: trimmedName },
  });

  if (metadataError) {
    console.error("Profile metadata update failed:", metadataError.message);
  }

  return { success: true, message: "Your profile has been updated." };
}
