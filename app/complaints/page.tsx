
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMyComplaintEvidence } from "@/app/actions/evidence";
import AppShell from "@/components/app-shell";
import Link from "next/link";

export default async function ComplaintsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: complaints, error } = await supabase
    .from("complaints")
    .select(
      "id, category, description, status, assigned_personnel, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>My Complaints</h1>
        <p>Error loading complaints: {error.message}</p>
      </main>
    );
  }

  const complaintsWithEvidence = await Promise.all(
    (complaints ?? []).map(async (complaint) => {
      const result = await getMyComplaintEvidence(complaint.id);

      return {
        ...complaint,
        evidence:
          result.success && result.evidence
            ? result.evidence
            : [],
      };
    })
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell mode="resident" userName={profile?.full_name || "Resident"} email={profile?.email || user.email}>
      <div className="page-header"><div><p className="eyebrow">Resident portal</p><h1 className="page-title">My complaints</h1><p className="page-subtitle">Track every environmental concern you have submitted.</p></div><Link className="button green" href="/complaints/new">＋ New complaint</Link></div>

      {complaintsWithEvidence.length === 0 ? (
        <section className="card empty-state">No complaints submitted yet. <Link className="text-link" href="/complaints/new">Submit your first complaint</Link>.</section>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {complaintsWithEvidence.map((complaint) => (
            <article
              key={complaint.id}
              className="card"
            >
              <div className="card-title"><h2>{complaint.category}</h2><span className={`badge ${complaint.status.toLowerCase().replace(" ", "-")}`}>{complaint.status}</span></div>
              <p className="page-subtitle">{complaint.description}</p>
              <p className="hint">Assigned personnel: {complaint.assigned_personnel || "Not yet assigned"} · Submitted {new Date(complaint.created_at).toLocaleString()}</p>
              <h3 style={{ color: "var(--navy)", fontSize: 13, marginTop: 22 }}>Uploaded evidence</h3>

              {complaint.evidence.length === 0 ? (
                <p className="hint">No evidence available for this complaint.</p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  {complaint.evidence.map((item) => (
                    <div key={item.id}>
                      {item.signedUrl ? (
                        <a
                          href={item.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={item.signedUrl}
                            alt="Complaint evidence"
                            style={{ display: "block", width: "220px", maxWidth: "100%", height: "180px", objectFit: "contain", border: "1px solid var(--border)", borderRadius: "8px", background: "#f9fafb" }}
                          />
                        </a>
                      ) : (
                        <p className="notice error">
                          Evidence could not be displayed. Please
                          refresh the page and try again.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}