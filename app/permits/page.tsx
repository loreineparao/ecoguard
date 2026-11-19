import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyPermitApplications } from "@/app/actions/permits";
import AppShell from "@/components/app-shell";
import SubmittedRequirements from "@/app/admin/permits/SubmittedRequirements";
import { ArrowLeft, Plus, TreePine } from "lucide-react";

export default async function MyPermitsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  if (!user.email_confirmed_at) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Your email address has not been confirmed yet. Please verify your email or click below to resend the confirmation link."
        )
    );
  }

  const result = await getMyPermitApplications();

  if (!result.success) {
    return (
      <AppShell
        mode="resident"
        userName="Resident"
        email={user.email}
        avatarUrl={user.user_metadata?.avatar_url || null}
      >
        <div className="notice error">
          Unable to load permit applications: {result.error}
        </div>
      </AppShell>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell
      mode="resident"
      userName={profile?.full_name || "Resident"}
      email={profile?.email || user.email}
      avatarUrl={profile?.avatar_url || user.user_metadata?.avatar_url || null}
    >
      <div className="page-header">
        <div>
          <p className="eyebrow">RESIDENT PORTAL • MABINI</p>
          <h1 className="page-title">My Applications</h1>
          <p className="page-subtitle">
            View submitted tree-cutting permit applications and MENR review status.
          </p>
        </div>
        <div className="page-header-actions">
          <Link className="button secondary" href="/dashboard">
            <ArrowLeft size={16} aria-hidden="true" /> Back to Dashboard
          </Link>
          <Link className="button green" href="/permits/new">
            <Plus size={16} aria-hidden="true" /> New Permit Application
          </Link>
        </div>
      </div>

      {result.applications.length === 0 ? (
        <section className="card empty-state">
          You have not submitted any permit applications yet.{" "}
          <Link className="text-link" href="/permits/new">
            Apply for a tree cutting permit
          </Link>
          .
        </section>
      ) : (
        <div style={{ display: "grid", gap: "18px" }}>
          {result.applications.map((application) => (
            <article key={application.id} className="card">
              <div className="card-title">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="activity-icon permit">
                    <TreePine size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h2>Tree Cutting Permit Application</h2>
                    <span className="muted-id">
                      Application ID: {application.id}
                    </span>
                  </div>
                </div>
                <span
                  className={`badge ${application.application_status
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                >
                  {application.application_status}
                </span>
              </div>

              <div
                className="permit-applicant-summary-box"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                  padding: "14px",
                  background: "var(--surface-elevated)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  margin: "14px 0",
                  fontSize: "13px",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    Applicant Name
                  </span>
                  <strong style={{ color: "var(--text-main)" }}>
                    {application.applicant_name}
                  </strong>
                </div>

                <div>
                  <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    Date Submitted
                  </span>
                  <strong style={{ color: "var(--text-main)" }}>
                    {application.submitted_at
                      ? new Date(application.submitted_at).toLocaleDateString()
                      : "Date unavailable"}
                  </strong>
                </div>

                <div>
                  <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    Service Office
                  </span>
                  <strong style={{ color: "var(--primary-green)" }}>
                    MENR Office — Mabini
                  </strong>
                </div>
              </div>

              <SubmittedRequirements
                requirements={application.documentary_requirements}
              />

              <p className="hint">
                Our MENR officers will review the documentary requirements and conduct an on-site inspection if necessary before approving your tree cutting permit.
              </p>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
