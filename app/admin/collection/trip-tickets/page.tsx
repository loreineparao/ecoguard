import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateTripTicket from "./CreateTripTicket";
import TripTicketsFilterableList from "./TripTicketsFilterableList";
import AppShell from "@/components/app-shell";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

export default async function AdminTripTicketsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("full_name, email, role, avatar_url")
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

  // Get collection schedules
  const { data: schedules, error: schedulesError } =
    await supabase
      .from("collection_schedules")
      .select(
        "id, barangay, collection_time, truck_id, driver_id"
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

  // Get trip tickets
  const { data: tickets, error: ticketsError } =
    await supabase
      .from("trip_tickets")
      .select(
        "id, schedule_id, estimated_load, actual_collection_time, driver_name, plate_number, created_at"
      )
      .order("created_at", { ascending: false });

  if (ticketsError) {
    return (
      <AppShell
        mode="admin"
        userName={profile.full_name || "MENR Administrator"}
        email={profile.email || user.email}
        avatarUrl={profile.avatar_url || user.user_metadata?.avatar_url || null}
      >
        <div className="notice error">
          Unable to load trip tickets: {ticketsError.message}
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
          <h1 className="page-title">Trip Ticket Management</h1>
          <p className="page-subtitle">
            Record, dispatch, and track actual waste hauling loads, drivers, and collection times.
          </p>
        </div>
        <div className="page-header-actions">
          <Link className="button secondary" href="/admin">
            <ArrowLeft size={16} aria-hidden="true" /> Back to Dashboard
          </Link>
          <Link className="button secondary" href="/admin/collection">
            <CalendarDays size={16} aria-hidden="true" /> View Collection Schedules
          </Link>
        </div>
      </div>

      {/* CREATE TRIP TICKET */}
      <CreateTripTicket schedules={schedules ?? []} />

      {/* EXISTING TRIP TICKETS WITH REAL-TIME FILTERING */}
      <h2 style={{ color: "var(--dark-forest)", margin: "32px 0 16px", fontSize: "18px", fontWeight: 700 }}>
        Recorded Trip Tickets ({tickets?.length ?? 0})
      </h2>

      <TripTicketsFilterableList
        tickets={tickets ?? []}
        schedules={schedules ?? []}
      />
    </AppShell>
  );
}
