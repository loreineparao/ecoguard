import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMyComplaintEvidence } from "@/app/actions/evidence";
import AppShell from "@/components/app-shell";
import Link from "next/link";
import { ArrowLeft, Plus, MessageSquare, ImageIcon } from "lucide-react";

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
      <AppShell mode="resident" userName="Resident" email={user.email}>
        <div className="notice error">
          Error loading complaints: {error.message}
        </div>
      </AppShell>
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
    <AppShell
      mode="resident"
      userName={profile?.full_name || "Resident"}
      email={profile?.email || user.email}
    >
      <div className="page-header">
        <div>
          <p className="eyebrow">RESIDENT PORTAL • MABINI</p>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-subtitle">
            Track and monitor every environmental concern you have submitted.
          </p>
        </div>
        <div className="page-header-actions">
          <Link className="button secondary" href="/dashboard">
            <ArrowLeft size={16} aria-hidden="true" /> Back to Dashboard
          </Link>
          <Link className="button green" href="/complaints/new">
            <Plus size={16} aria-hidden="true" /> Submit New Complaint
          </Link>
        </div>
      </div>

      {complaintsWithEvidence.length === 0 ? (
        <section className="card empty-state">
          No complaints submitted yet.{" "}
          <Link className="text-link" href="/complaints/new">
            Submit your first complaint
          </Link>
          .
        </section>
      ) : (
        <div style={{ display: "grid", gap: "18px" }}>
          {complaintsWithEvidence.map((complaint) => (
            <article key={complaint.id} className="card">
              <div className="card-title">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="activity-icon complaint">
                    <MessageSquare size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h2>{complaint.category}</h2>
                    <span className="muted-id">
                      Case Reference: {complaint.id}
                    </span>
                  </div>
                </div>
                <span
                  className={`badge ${complaint.status
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                >
                  {complaint.status}
                </span>
              </div>

              <p style={{ margin: "14px 0", lineHeight: 1.6, color: "var(--text-main)" }}>
                {complaint.description}
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "18px",
                  padding: "12px 14px",
                  background: "#F8FAFC",
                  borderRadius: "9px",
                  border: "1px solid var(--border)",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                }}
              >
                <div>
                  <strong>Assigned Personnel:</strong>{" "}
                  {complaint.assigned_personnel || "Pending assignment by MENR"}
                </div>
                <div>
                  <strong>Submitted:</strong>{" "}
                  {new Date(complaint.created_at).toLocaleString()}
                </div>
              </div>

              <h3
                style={{
                  color: "var(--dark-forest)",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  marginTop: "20px",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ImageIcon size={15} aria-hidden="true" /> Uploaded Evidence
              </h3>

              {complaint.evidence.length === 0 ? (
                <p className="hint">No photographic evidence attached to this report.</p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "14px",
                  }}
                >
                  {complaint.evidence.map((item) => (
                    <div key={item.id}>
                      {item.signedUrl ? (
                        <a
                          href={item.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Click to view full image"
                        >
                          <img
                            src={item.signedUrl}
                            alt="Complaint photographic evidence"
                            style={{
                              display: "block",
                              width: "240px",
                              maxWidth: "100%",
                              height: "170px",
                              objectFit: "cover",
                              border: "1px solid var(--border)",
                              borderRadius: "10px",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                            }}
                          />
                        </a>
                      ) : (
                        <p className="notice error">
                          Evidence could not be previewed.
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
