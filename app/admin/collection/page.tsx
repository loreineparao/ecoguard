import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CollectionActions from "./CollectionActions";
import CreateCollectionSchedule from "./CreateCollectionSchedule";
import AppShell from "@/components/app-shell";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Truck } from "lucide-react";

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
    .select("full_name, email, role")
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

      {!schedules || schedules.length === 0 ? (
        <section className="card empty-state">
          No collection schedules have been created yet.
        </section>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {schedules.map((schedule) => (
            <article key={schedule.id} className="card">
              <div className="card-title">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="activity-icon" style={{ background: "var(--light-green)", color: "var(--primary-green)" }}>
                    <CalendarDays size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h2>{schedule.barangay}</h2>
                    <span className="muted-id">Schedule ID: {schedule.id}</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                  padding: "14px",
                  background: "#F8FAFC",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  margin: "12px 0",
                  fontSize: "13px",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    Collection Time
                  </span>
                  <strong style={{ color: "var(--text-main)" }}>
                    {new Date(schedule.collection_time).toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    Assigned Truck
                  </span>
                  <strong style={{ color: "var(--dark-forest)" }}>
                    {schedule.truck_id ?? "Not assigned"}
                  </strong>
                </div>

                <div>
                  <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    Assigned Driver
                  </span>
                  <strong style={{ color: "var(--dark-forest)" }}>
                    {schedule.driver_id ?? "Not assigned"}
                  </strong>
                </div>
              </div>

              <CollectionActions
                scheduleId={schedule.id}
                currentBarangay={schedule.barangay}
                currentCollectionTime={schedule.collection_time}
                currentTruckId={schedule.truck_id}
                currentDriverId={schedule.driver_id}
              />
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
