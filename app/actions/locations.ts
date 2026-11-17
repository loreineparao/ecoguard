
"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveComplaintLocation(
  complaintId: string,
  latitude: number,
  longitude: number,
  address: string | null = null
) {
  const supabase = await createClient();

  // 1. Verify the logged-in resident
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to save a complaint location.",
    };
  }

  // 2. Validate the complaint ID and coordinates
  if (!complaintId) {
    return {
      success: false,
      error: "Complaint ID is required.",
    };
  }

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      success: false,
      error: "Invalid location coordinates.",
    };
  }

  // 3. Confirm the complaint belongs to this resident
  const { data: complaint, error: complaintError } =
    await supabase
      .from("complaints")
      .select("id")
      .eq("id", complaintId)
      .eq("user_id", user.id)
      .maybeSingle();

  if (complaintError) {
    return {
      success: false,
      error: complaintError.message,
    };
  }

  if (!complaint) {
    return {
      success: false,
      error:
        "Complaint not found or you do not have permission to save its location.",
    };
  }

  // 4. Save the location in Supabase (avoid duplicate location records for the same complaint)
  const { data: existingLoc } = await supabase
    .from("locations")
    .select("id")
    .eq("complaint_id", complaintId)
    .maybeSingle();

  if (existingLoc) {
    const { data: updated, error: updateError } = await supabase
      .from("locations")
      .update({
        latitude,
        longitude,
        address: address || null,
      })
      .eq("id", existingLoc.id)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    return {
      success: true,
      location: updated,
    };
  }

  const { data, error } = await supabase
    .from("locations")
    .insert({
      complaint_id: complaintId,
      latitude,
      longitude,
      address: address || null,
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
    location: data,
  };
}

export async function getAddressFromCoordinates(
  latitude: number,
  longitude: number
) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      success: false,
      error: "Invalid location coordinates.",
    };
  }

  try {
    const url = new URL(
      "https://nominatim.openstreetmap.org/reverse"
    );

    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "EcoGuardEnvironmentalManagement/1.0",
        "Accept-Language": "en",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: "Address lookup is temporarily unavailable.",
      };
    }

    const data = await response.json();

    if (!data.display_name) {
      return {
        success: false,
        error: "No readable address was found.",
      };
    }

    return {
      success: true,
      address: data.display_name as string,
    };
  } catch {
    return {
      success: false,
      error: "Unable to retrieve the address. Please try again.",
    };
  }
}