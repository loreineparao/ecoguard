import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CollectionActions from "./CollectionActions";
import CreateCollectionSchedule from "./CreateCollectionSchedule";

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
      <main
        style={{
          minHeight: "100vh",
          padding: "40px 20px",
          background: "#f4f7fb",
        }}
      >
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
      <main
        style={{
          minHeight: "100vh",
          padding: "40px 20px",
          background: "#f4f7fb",
        }}
      >
        <h1>Garbage Collection Management</h1>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
          }}
        >
          Unable to load collection schedules:{" "}
          {schedulesError.message}
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#f4f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              color: "#166534",
              marginBottom: "10px",
            }}
          >
            Garbage Collection Management
          </h1>

          <p
            style={{
              color: "#555",
              marginBottom: "25px",
            }}
          >
            Manage garbage collection schedules, truck
            assignments, and drivers.
          </p>

          <CreateCollectionSchedule />

          {schedules && schedules.length === 0 && (
            <div
              style={{
                padding: "20px",
                background: "#f3f4f6",
                borderRadius: "8px",
                color: "#555",
              }}
            >
              No collection schedules have been created yet.
            </div>
          )}

          <div
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            {schedules?.map((schedule) => (
              <div
                key={schedule.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "20px",
                  background: "#fff",
                }}
              >
                <h2
                  style={{
                    marginBottom: "15px",
                    fontSize: "20px",
                  }}
                >
                  Garbage Collection Schedule
                </h2>

                <p>
                  <strong>Barangay:</strong>{" "}
                  {schedule.barangay}
                </p>

                <p>
                  <strong>Collection Time:</strong>{" "}
                  {new Date(
                    schedule.collection_time
                  ).toLocaleString()}
                </p>

                <p>
                  <strong>Truck:</strong>{" "}
                  {schedule.truck_id ?? "Not assigned"}
                </p>

                <p>
                  <strong>Driver:</strong>{" "}
                  {schedule.driver_id ?? "Not assigned"}
                </p>

                <p
                  style={{
                    marginTop: "10px",
                    wordBreak: "break-all",
                    fontSize: "13px",
                    color: "#666",
                  }}
                >
                  <strong>Schedule ID:</strong>{" "}
                  {schedule.id}
                </p>
                <CollectionActions
  scheduleId={schedule.id}
  currentBarangay={schedule.barangay}
  currentCollectionTime={schedule.collection_time}
  currentTruckId={schedule.truck_id}
  currentDriverId={schedule.driver_id}
/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}