
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyPermitApplications } from "@/app/actions/permits";
import AppShell from "@/components/app-shell";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell mode="resident" userName={profile?.full_name || "Resident"} email={profile?.email || user.email}>
      <div className="page-header"><div><p className="eyebrow">Resident portal</p><h1 className="page-title">My permit applications</h1><p className="page-subtitle">View submitted documents and application progress.</p></div><Link className="button green" href="/permits/new">＋ New permit application</Link></div>

        {result.applications.length === 0 ? (
          <section className="card empty-state">
            You have not submitted any permit applications yet.
          </section>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {result.applications.map((application) => (
              <article
                key={application.id}
                className="card"
              >
                <div className="card-title"><h2>{application.applicant_name}</h2><span className={`badge ${application.application_status.toLowerCase().replace(" ", "-")}`}>{application.application_status}</span></div>
                <p className="hint">Application ID: {application.id}</p>
                <p className="page-subtitle">Submitted {application.submitted_at ? new Date(application.submitted_at).toLocaleString() : "Date unavailable"}</p>
              </article>
            ))}
          </div>
        )}
    </AppShell>
  );
}