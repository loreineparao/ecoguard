import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, complaints, permits, schedules] = await Promise.all([
    supabase.from("profiles").select("full_name, email, role").eq("id", user.id).maybeSingle(),
    supabase.from("complaints").select("id, category, status, created_at").order("created_at", { ascending: false }),
    supabase.from("permit_applications").select("id, applicant_name, application_status, submitted_at").order("submitted_at", { ascending: false }),
    supabase.from("collection_schedules").select("id, barangay, collection_time").order("collection_time", { ascending: true }),
  ]);
  if (profile?.role !== "admin") redirect("/dashboard");
  const allComplaints = complaints.data ?? [];
  const statusCount = (status: string) => allComplaints.filter((item) => item.status === status).length;
  const name = profile.full_name || "MENR Administrator";
  return <AppShell mode="admin" userName={name} email={profile.email ?? user.email}>
    <div className="page-header"><div><p className="eyebrow">MENR operations</p><h1 className="page-title">Admin dashboard</h1><p className="page-subtitle">Monitor environmental services across Mabini, Batangas.</p></div><Link href="/admin/reports" className="button secondary">▥ Reports center</Link></div>
    <div className="stats-grid">
      <Stat label="Total complaints" value={allComplaints.length} icon="▤" /><Stat label="Pending review" value={statusCount("Pending")} icon="◷" /><Stat label="Dispatched" value={statusCount("Dispatched")} icon="↗" /><Stat label="Resolved" value={statusCount("Resolved")} icon="✓" green />
    </div>
    <div className="content-grid">
      <section className="card"><div className="card-title"><h2>Recent complaints</h2><Link className="text-link" href="/admin/complaints">Manage complaints</Link></div>{allComplaints.length === 0 ? <div className="empty-state">No complaints have been submitted.</div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Category</th><th>Submitted</th><th>Status</th></tr></thead><tbody>{allComplaints.slice(0, 6).map((item) => <tr key={item.id}><td><strong>{item.category}</strong><div className="muted-id">{item.id.slice(0, 8)}…</div></td><td>{new Date(item.created_at).toLocaleDateString()}</td><td><span className={`badge ${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span></td></tr>)}</tbody></table></div>}</section>
      <aside className="card"><div className="card-title"><h2>Service snapshot</h2></div><div className="snapshot-row"><span>Permit applications</span><strong>{permits.data?.length ?? 0}</strong></div><div className="snapshot-row"><span>Collection schedules</span><strong>{schedules.data?.length ?? 0}</strong></div><div className="snapshot-row"><span>Under review</span><strong>{statusCount("Under Review")}</strong></div><div className="quick-actions" style={{ marginTop: 18 }}><Link href="/admin/collection" className="button secondary">Manage collection schedules</Link><Link href="/admin/permits" className="button secondary">Review permits</Link></div></aside>
    </div>
  </AppShell>;
}

function Stat({ label, value, icon, green = false }: { label: string; value: number; icon: string; green?: boolean }) {
  return <div className={`stat-card ${green ? "green" : ""}`}><div className="stat-top"><span className="stat-label">{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value}</div></div>;
}
