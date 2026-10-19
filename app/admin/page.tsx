import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  // 1. Check logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Check user's role
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "40px",
          background: "#f4f7fb",
        }}
      >
        <h1>Access Error</h1>
        <p>Unable to verify your account role.</p>
      </main>
    );
  }

  // 3. Only administrators can access this page
  if (profile.role !== "admin") {
    redirect("/dashboard");
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
          maxWidth: "900px",
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
            EcoGuard MENR Admin Dashboard
          </h1>

          <p
            style={{
              color: "#555",
              marginBottom: "20px",
            }}
          >
            Welcome, {profile.full_name}.
          </p>

          <div
            style={{
              padding: "15px",
              background: "#f0fdf4",
              borderRadius: "8px",
              marginBottom: "25px",
            }}
          >
            <strong>Admin Account</strong>

            <p style={{ marginTop: "8px" }}>
              Email: {profile.email ?? user.email}
            </p>

            <p>
              Role: <strong>{profile.role}</strong>
            </p>
          </div>

          <h2
            style={{
              marginBottom: "15px",
            }}
          >
            MENR Management Modules
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
            }}
          >
            <div
              style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <h3>Environmental Complaints</h3>
              <p style={{ color: "#666" }}>
                Review, verify, dispatch, and monitor complaints.
              </p>
            </div>

            <div
              style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <h3>Tree Cutting Permits</h3>
              <p style={{ color: "#666" }}>
                Review permit applications and documents.
              </p>
            </div>

            <div
              style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <h3>Garbage Collection</h3>
              <p style={{ color: "#666" }}>
                Manage schedules, trucks, drivers, and trip tickets.
              </p>
            </div>

            <div
              style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <h3>Reports</h3>
              <p style={{ color: "#666" }}>
                Generate and manage environmental reports.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}