import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateReport from "./CreateReport";

export default async function AdminReportsPage() {
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
        <h1>Reports</h1>
        <p>Unable to verify your account.</p>
      </main>
    );
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: reports, error: reportsError } =
    await supabase
      .from("reports")
      .select("id, report_type, generated_at, generated_by")
      .order("generated_at", { ascending: false });

  if (reportsError) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Reports</h1>
        <p>
          Unable to load reports: {reportsError.message}
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      <h1 style={{ marginBottom: "10px" }}>
        Reports
      </h1>

      <p
        style={{
          color: "#666",
          marginBottom: "30px",
        }}
      >
        Generate and manage environmental complaint and
        garbage collection reports.
      </p>

      <CreateReport />

      <h2
        style={{
          marginTop: "35px",
          marginBottom: "15px",
        }}
      >
        Generated Reports
      </h2>

      {!reports || reports.length === 0 ? (
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            background: "#f9fafb",
          }}
        >
          <p>No reports have been generated yet.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "15px",
          }}
        >
          {reports.map((report) => (
            <div
              key={report.id}
              style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "10px",
                background: "white",
              }}
            >
              <h3 style={{ marginBottom: "10px" }}>
                {report.report_type}
              </h3>

              <p>
                <strong>Generated:</strong>{" "}
                {new Date(
                  report.generated_at
                ).toLocaleString()}
              </p>

              <p
                style={{
                  marginTop: "6px",
                  fontSize: "13px",
                  color: "#666",
                }}
              >
                <strong>Report ID:</strong>{" "}
                {report.id}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}