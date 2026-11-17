import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ComplaintsFilterableList from "./ComplaintsFilterableList";
import AppShell from "@/components/app-shell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminComplaintsPage() {
  const supabase = await createClient();

  // 1. Check logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Check admin role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Access Error</h1>
        <p>Unable to verify your account.</p>
      </main>
    );
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  // 3. Get all complaints and associated location addresses
  const [{ data: complaints, error: complaintsError }, { data: locations }] =
    await Promise.all([
      supabase
        .from("complaints")
        .select(
          "id, user_id, category, description, status, assigned_personnel, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase.from("locations").select("complaint_id, address"),
    ]);

  if (complaintsError) {
    return (
      <AppShell
        mode="admin"
        userName={profile.full_name || "MENR Administrator"}
        email={profile.email || user.email}
      >
        <div className="notice error">
          Unable to load complaints: {complaintsError.message}
        </div>
      </AppShell>
    );
  }

  const locationMap = new Map<string, string>();
  (locations || []).forEach((loc) => {
    if (loc.complaint_id && loc.address) {
      locationMap.set(loc.complaint_id, loc.address);
    }
  });

  const complaintsWithLocations = (complaints || []).map((c) => ({
    ...c,
    address: locationMap.get(c.id) || null,
  }));

  return (
    <AppShell
      mode="admin"
      userName={profile.full_name || "MENR Administrator"}
      email={profile.email || user.email}
    >
      <div className="page-header">
        <div>
          <p className="eyebrow">MENR OPERATIONS • MABINI</p>
          <h1 className="page-title">Environmental Complaints Management</h1>
          <p className="page-subtitle">
            Review, evaluate, assign personnel, and dispatch actions for resident-submitted concerns.
          </p>
        </div>
        <Link className="button secondary" href="/admin">
          <ArrowLeft size={16} aria-hidden="true" /> Back to Dashboard
        </Link>
      </div>

      <ComplaintsFilterableList complaints={complaintsWithLocations} />
    </AppShell>
  );
}
