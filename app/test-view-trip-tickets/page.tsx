import { createClient } from "@/lib/supabase/server";

export default async function TestViewTripTicketsPage() {
  const supabase = await createClient();

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>You must be logged in.</h1>
      </main>
    );
  }

  // Check user's role
  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Error loading profile</h1>
        <p>{profileError.message}</p>
      </main>
    );
  }

  if (!profile || profile.role !== "admin") {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Access Denied</h1>
        <p>Only administrators can view trip tickets.</p>
      </main>
    );
  }

  // Get trip tickets
  const { data: tickets, error: ticketsError } =
    await supabase
      .from("trip_tickets")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

  if (ticketsError) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Error loading trip tickets</h1>
        <p>{ticketsError.message}</p>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>EcoGuard - Trip Tickets</h1>

      <p>
        Logged-in user: {user.email}
      </p>

      <p>
        Total trip tickets: {tickets.length}
      </p>

      {tickets.length === 0 ? (
        <p>No trip tickets found.</p>
      ) : (
        <div style={{ marginTop: "25px" }}>
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              style={{
                border: "1px solid #ccc",
                padding: "20px",
                marginBottom: "15px",
                borderRadius: "8px",
              }}
            >
              <p>
                <strong>Ticket ID:</strong>{" "}
                {ticket.id}
              </p>

              <p>
                <strong>Schedule ID:</strong>{" "}
                {ticket.schedule_id}
              </p>

              <p>
                <strong>Estimated Load:</strong>{" "}
                {ticket.estimated_load ||
                  "Not specified"}
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
                <strong>Driver:</strong>{" "}
                {ticket.driver_name}
              </p>

              <p>
                <strong>Plate Number:</strong>{" "}
                {ticket.plate_number}
              </p>

              <p>
                <strong>Created:</strong>{" "}
                {new Date(
                  ticket.created_at
                ).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}