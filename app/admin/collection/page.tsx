import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CollectionSchedulesList from "./CollectionSchedulesList";
import CreateCollectionSchedule from "./CreateCollectionSchedule";
import AppShell from "@/components/app-shell";
import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";

export default async function AdminCollectionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify admin role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Access Error</h1>
        <p>Unable to verify your account role.</p>
      </main>
    );
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  // Get collection schedules
  const { data: schedules, error: schedulesError } =
    await supabase
      .from("collection_schedules")
      .select(
        "id, barangay, collection_time, truck_id, driver_id, created_at"
      )
      .order("collection_time", { ascending: true });

  if (schedulesError) {
    return (
      <AppShell
        mode="admin"
        userName={profile.full_name || "MENR Administrator"}
        email={profile.email || user.email}
        avatarUrl={profile.avatar_url || user.user_metadata?.avatar_url || null}
      >
        <div className="notice error">
          Unable to load collection schedules: {schedulesError.message}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      mode="admin"
      userName={profile.full_name || "MENR Administrator"}
      email={profile.email || user.email}
      avatarUrl={profile.avatar_url || user.user_metadata?.avatar_url || null}
    >
      <div className="page-header">
        <div>
          <p className="eyebrow">MENR OPERATIONS • MABINI</p>
          <h1 className="page-title">Garbage Collection Management</h1>
          <p className="page-subtitle">
            Create, update, and coordinate municipal waste collection schedules, trucks, and assigned drivers.
          </p>
        </div>
        <div className="page-header-actions">
          <Link className="button secondary" href="/admin">
            <ArrowLeft size={16} aria-hidden="true" /> Back to Dashboard
          </Link>
          <Link className="button green" href="/admin/collection/trip-tickets">
            <Truck size={16} aria-hidden="true" /> Trip Tickets
          </Link>
        </div>
      </div>

      <CreateCollectionSchedule />

      <h2 style={{ color: "var(--dark-forest)", margin: "32px 0 16px", fontSize: "18px", fontWeight: 700 }}>
        Active Collection Schedules ({schedules?.length ?? 0})
      </h2>

      <CollectionSchedulesList initialSchedules={schedules ?? []} />
    </AppShell>
  );
}
