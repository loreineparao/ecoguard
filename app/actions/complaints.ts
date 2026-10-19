"use server";

import { createClient } from "@/lib/supabase/server";

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

  // Create the complaint
  const { data, error } = await supabase
    .from("complaints")
    .insert({
      user_id: user.id,
      category: category,
      description: description,
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