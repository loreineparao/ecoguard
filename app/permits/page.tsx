
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyPermitApplications } from "@/app/actions/permits";

export default async function MyPermitsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const result = await getMyPermitApplications();

  if (!result.success) {
    return (
      <main style={{ padding: "40px", background: "#f4f7fb", minHeight: "100vh" }}>
        <h1>My Permit Applications</h1>
        <p style={{ color: "#dc2626" }}>{result.error}</p>
        <Link href="/dashboard">Back to Dashboard</Link>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "30px 20px",
        background: "#f4f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ color: "#166534", marginBottom: "10px" }}>
          My Permit Applications
        </h1>

        <p style={{ color: "#555", marginBottom: "24px" }}>
          View the Tree Cutting Permit Applications submitted through your account.
        </p>

        <Link
          href="/permits/new"
          style={{
            display: "inline-block",
            padding: "10px 16px",
            background: "#166534",
            color: "white",
            borderRadius: "8px",
            textDecoration: "none",
            marginBottom: "24px",
          }}
        >
          + New Permit Application
        </Link>

        {result.applications.length === 0 ? (
          <p style={{ color: "#666" }}>
            You have not submitted any permit applications yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {result.applications.map((application) => (
              <article
                key={application.id}
                style={{
                  padding: "18px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
              >
                <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
                  {application.applicant_name}
                </h2>

                <p>
                  <strong>Application ID:</strong> {application.id}
                </p>

                <p style={{ marginTop: "6px" }}>
                  <strong>Status:</strong> {application.application_status}
                </p>
              </article>
            ))}
          </div>
        )}

        <div style={{ marginTop: "28px" }}>
          <Link href="/dashboard" style={{ color: "#166534" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}