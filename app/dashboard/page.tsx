import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "#f4f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
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
          EcoGuard Dashboard
        </h1>

        <p style={{ marginBottom: "20px", color: "#555" }}>
          You are successfully logged in.
        </p>

        <div
          style={{
            padding: "15px",
            background: "#f0fdf4",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <strong>Logged-in email:</strong>
          <p>{user.email}</p>
        </div>

        <LogoutButton />
      </div>
    </main>
  );
}