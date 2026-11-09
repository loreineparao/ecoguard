import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TripTicketActions from "./TripTicketActions";
import CreateTripTicket from "./CreateTripTicket";
import AppShell from "@/components/app-shell";

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
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError || !profile) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Trip Ticket Management</h1>
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
      <main style={{ padding: "40px" }}>
        <h1>Trip Ticket Management</h1>
        <p>
          Unable to load collection schedules:{" "}
          {schedulesError.message}
        </p>
      </main>
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
      <main style={{ padding: "40px" }}>
        <h1>Trip Ticket Management</h1>
        <p>
          Unable to load trip tickets:{" "}
          {ticketsError.message}
        </p>
      </main>
    );
  }

  return (
    <AppShell mode="admin" userName="MENR Administrator" email={user.email}>
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      <h1 style={{ marginBottom: "10px" }}>
        Trip Ticket Management
      </h1>

      <p
        style={{
          color: "#666",
          marginBottom: "25px",
        }}
      >
        Record and manage garbage collection trip tickets.
      </p>

      {/* CREATE TRIP TICKET */}
      <CreateTripTicket schedules={schedules ?? []} />

      {/* EXISTING TRIP TICKETS */}
      <h2 style={{ marginTop: "30px", marginBottom: "15px" }}>
        Recorded Trip Tickets
      </h2>

      {tickets && tickets.length === 0 && (
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            background: "#f9fafb",
          }}
        >
          <p>No trip tickets have been recorded yet.</p>
        </div>
      )}

      {tickets && tickets.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "10px",
                background: "white",
              }}
            >
              <h3 style={{ marginBottom: "12px" }}>
                Trip Ticket
              </h3>

              <p>
                <strong>Schedule ID:</strong>{" "}
                {ticket.schedule_id}
              </p>

              <p>
                <strong>Estimated Load:</strong>{" "}
                {ticket.estimated_load ?? "Not specified"}
              </p>

              <p>
                <strong>Actual Collection Time:</strong>{" "}
                {ticket.actual_collection_time
                  ? new Date(
                      ticket.actual_collection_time
                    ).toLocaleString()
                  : "Not recorded"}
              </p>

              <p>
                <strong>Driver Name:</strong>{" "}
                {ticket.driver_name}
              </p>

              <p>
                <strong>Plate Number:</strong>{" "}
                {ticket.plate_number}
              </p>

              <p>
                <strong>Ticket ID:</strong>{" "}
                {ticket.id}
              </p>

              <TripTicketActions
                ticketId={ticket.id}
                currentEstimatedLoad={
                  ticket.estimated_load
                }
                currentActualCollectionTime={
                  ticket.actual_collection_time
                }
                currentDriverName={
                  ticket.driver_name
                }
                currentPlateNumber={
                  ticket.plate_number
                }
              />
            </div>
          ))}
        </div>
      )}
    </main>
    </AppShell>
  );
}