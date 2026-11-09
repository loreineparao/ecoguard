import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";

type Complaint = { id: string; category: string; status: string; created_at: string };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: complaints }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, role").eq("id", user.id).maybeSingle(),
    supabase.from("complaints").select("id, category, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  if (profile?.role === "admin") redirect("/admin");

  const items = (complaints ?? []) as Complaint[];
  const count = (status: string) => items.filter((item) => item.status === status).length;
  const name = profile?.full_name || user.user_metadata?.full_name || "Resident";

  return (
    <AppShell mode="resident" userName={name} email={profile?.email ?? user.email}>
      <div className="page-header">
        <div><p className="eyebrow">Resident overview</p><h1 className="page-title">Good day, {name.split(" ")[0]}.</h1><p className="page-subtitle">Stay informed and make a difference in your community.</p></div>
        <Link className="button green" href="/complaints/new">＋ Submit a complaint</Link>
      </div>
      <div className="stats-grid">
        <Stat label="Total complaints" value={items.length} icon="▤" />
        <Stat label="Pending" value={count("Pending")} icon="◷" />
        <Stat label="Under review" value={count("Under Review")} icon="◌" />
        <Stat label="Resolved" value={count("Resolved")} icon="✓" green />
      </div>
      <div className="content-grid">
        <section className="card">
          <div className="card-title"><h2>Recent complaint activity</h2><Link className="text-link" href="/complaints">View all</Link></div>
          {items.length === 0 ? <div className="empty-state">You have not submitted a complaint yet.</div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Category</th><th>Submitted</th><th>Status</th></tr></thead><tbody>{items.slice(0, 5).map((item) => <tr key={item.id}><td><strong>{item.category}</strong><div className="muted-id">{item.id.slice(0, 8)}…</div></td><td>{new Date(item.created_at).toLocaleDateString()}</td><td><span className={`badge ${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span></td></tr>)}</tbody></table></div>}
        </section>
        <aside className="card">
          <div className="card-title"><h2>Quick actions</h2></div>
          <div className="quick-actions">
            <Link href="/complaints/new" className="quick-action"><span className="stat-icon">＋</span><span><strong>Report an issue</strong><small className="muted-id">Submit an environmental complaint</small></span></Link>
            <Link href="/permits/new" className="quick-action"><span className="stat-icon">♧</span><span><strong>Apply for a permit</strong><small className="muted-id">Start a tree cutting application</small></span></Link>
            <Link href="/ai-assistant" className="quick-action"><span className="stat-icon">✦</span><span><strong>Ask EcoGuard AI</strong><small className="muted-id">Get guidance on your concern</small></span></Link>
          </div>
        </aside>
      </div>
      <section className="card announcement-card"><div className="card-title"><h2>Community information</h2><span className="badge approved">MENR update</span></div><p className="page-subtitle">Help keep Mabini clean by reporting illegal dumping through EcoGuard. Include a clear description, location, and photo evidence when it is safe to do so.</p></section>
    </AppShell>
  );
}

function Stat({ label, value, icon, green = false }: { label: string; value: number; icon: string; green?: boolean }) {
  return <div className={`stat-card ${green ? "green" : ""}`}><div className="stat-top"><span className="stat-label">{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value}</div></div>;
}
