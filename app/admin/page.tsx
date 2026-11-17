import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Send,
  Timer,
} from "lucide-react";
import type { ReactNode } from "react";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, complaints, permits, schedules] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("complaints")
        .select("id, category, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("permit_applications")
        .select("id, applicant_name, application_status, submitted_at")
        .order("submitted_at", { ascending: false }),
      supabase
        .from("collection_schedules")
        .select("id, barangay, collection_time")
        .order("collection_time", { ascending: true }),
    ]);

  if (profile?.role !== "admin") redirect("/dashboard");

  const allComplaints = complaints.data ?? [];
  const statusCount = (status: string) =>
    allComplaints.filter((item) => item.status === status).length;
  const name = profile?.full_name || "MENR Administrator";

  return (
    <AppShell
      mode="admin"
      userName={name}
      email={profile?.email ?? user.email}
    >
      <div className="page-header">
        <div>
          <p className="eyebrow">MENR OPERATIONS • MABINI, BATANGAS</p>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">
            Comprehensive oversight of environmental reports, permits, and waste logistics.
          </p>
        </div>
        <Link href="/admin/reports" className="button secondary">
          Reports Center <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <div className="stats-grid">
        <Stat
          label="Total Complaints"
          value={allComplaints.length}
          icon={<FileText size={18} aria-hidden="true" />}
          tone="filed"
        />
        <Stat
          label="Pending Review"
          value={statusCount("Pending")}
          icon={<Timer size={18} aria-hidden="true" />}
          tone="pending"
        />
        <Stat
          label="Dispatched"
          value={statusCount("Dispatched")}
          icon={<Send size={18} aria-hidden="true" />}
          tone="review"
        />
        <Stat
          label="Resolved"
          value={statusCount("Resolved")}
          icon={<CheckCircle2 size={18} aria-hidden="true" />}
          tone="resolved"
        />
      </div>

      <div className="content-grid">
        <section className="card">
          <div className="card-title">
            <div>
              <h2>Recent Complaints</h2>
              <p className="hint">Latest incident reports submitted by residents.</p>
            </div>
            <Link className="text-link" href="/admin/complaints">
              Manage All <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          {allComplaints.length === 0 ? (
            <div className="empty-state">
              No environmental complaints have been submitted yet.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allComplaints.slice(0, 6).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.category}</strong>
                        <div className="muted-id">Ref: {item.id.slice(0, 8)}…</div>
                      </td>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={`badge ${item.status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="card">
          <div className="card-title">
            <div>
              <h2>Service Operations Snapshot</h2>
              <p className="hint">Real-time municipality metrics.</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "16px 0 24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                background: "#F8FAFC",
                borderRadius: "8px",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileCheck2 size={17} color="var(--primary-green)" aria-hidden="true" />
                <span style={{ fontSize: "13px", fontWeight: 500 }}>Permit Applications</span>
              </div>
              <strong style={{ fontSize: "16px", color: "var(--dark-forest)" }}>
                {permits.data?.length ?? 0}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                background: "#F8FAFC",
                borderRadius: "8px",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CalendarDays size={17} color="var(--primary-green)" aria-hidden="true" />
                <span style={{ fontSize: "13px", fontWeight: 500 }}>Collection Schedules</span>
              </div>
              <strong style={{ fontSize: "16px", color: "var(--dark-forest)" }}>
                {schedules.data?.length ?? 0}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                background: "#F8FAFC",
                borderRadius: "8px",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Clock3 size={17} color="#0284C7" aria-hidden="true" />
                <span style={{ fontSize: "13px", fontWeight: 500 }}>Under Active Review</span>
              </div>
              <strong style={{ fontSize: "16px", color: "var(--dark-forest)" }}>
                {statusCount("Under Review")}
              </strong>
            </div>
          </div>

          <div className="quick-actions">
            <Link href="/admin/collection" className="button secondary" style={{ width: "100%", justifyContent: "flex-start" }}>
              <CalendarDays size={16} aria-hidden="true" /> Manage Waste Schedules
            </Link>
            <Link href="/admin/permits" className="button secondary" style={{ width: "100%", justifyContent: "flex-start" }}>
              <FileCheck2 size={16} aria-hidden="true" /> Review Tree Cutting Permits
            </Link>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
