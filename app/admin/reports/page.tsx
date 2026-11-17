import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateReport from "./CreateReport";
import AppShell from "@/components/app-shell";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText, User } from "lucide-react";

export default async function AdminReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, role")
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

  const [{ data: reports, error: reportsError }, { data: adminProfiles }] =
    await Promise.all([
      supabase
        .from("reports")
        .select("id, report_type, generated_at, generated_by")
        .order("generated_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email"),
    ]);

  if (reportsError) {
    return (
      <AppShell
        mode="admin"
        userName={profile.full_name || "MENR Administrator"}
        email={profile.email || user.email}
      >
        <div className="notice error">
          Unable to load reports: {reportsError.message}
        </div>
      </AppShell>
    );
  }

  const profileMap = new Map<string, string>();
  (adminProfiles || []).forEach((p) => {
    if (p.id) {
      profileMap.set(p.id, p.full_name || p.email || "Administrator");
    }
  });

  return (
    <AppShell
      mode="admin"
      userName={profile.full_name || "MENR Administrator"}
      email={profile.email || user.email}
    >
      <div className="page-header no-print">
        <div>
          <p className="eyebrow">MENR OPERATIONS • MABINI</p>
          <h1 className="page-title">Reports & Municipal Audits</h1>
          <p className="page-subtitle">
            Compile verified audit statistics, export official CSV spreadsheets, and generate environmental summaries.
          </p>
        </div>
        <Link className="button secondary" href="/admin">
          <ArrowLeft size={16} aria-hidden="true" /> Back to Dashboard
        </Link>
      </div>

      <CreateReport />

      <div className="no-print" style={{ marginTop: "36px" }}>
        <h2 style={{ color: "var(--dark-forest)", margin: "0 0 16px", fontSize: "18px", fontWeight: 700 }}>
          Generated Reports Archive ({reports?.length ?? 0})
        </h2>

        {!reports || reports.length === 0 ? (
          <section className="card empty-state">
            No reports have been generated yet. Use the configuration form above to compile an official report.
          </section>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {reports.map((report) => {
              const creatorName =
                (report.generated_by && profileMap.get(report.generated_by)) ||
                (report.generated_by ? "MENR Officer" : "System Administrator");

              return (
                <article key={report.id} className="card">
                  <div className="card-title">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        className="activity-icon"
                        style={{ background: "var(--light-green)", color: "var(--primary-green)" }}
                      >
                        <FileText size={18} aria-hidden="true" />
                      </span>
                      <div>
                        <h2>{report.report_type}</h2>
                        <span className="muted-id">Archive ID: {report.id}</span>
                      </div>
                    </div>
                    <span className="badge resolved">
                      <CheckCircle2 size={12} aria-hidden="true" /> Archived
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "20px",
                      fontSize: "12.5px",
                      color: "var(--text-secondary)",
                      marginTop: "10px",
                    }}
                  >
                    <div>
                      <strong>Generated On:</strong>{" "}
                      {new Date(report.generated_at).toLocaleString()}
                    </div>
                    <div>
                      <strong style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <User size={13} aria-hidden="true" /> Auditor / Officer:
                      </strong>{" "}
                      <span>{creatorName}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
