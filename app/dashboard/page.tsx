import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  MapPin,
  MessageSquare,
  Plus,
  Timer,
  Truck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";

type Complaint = {
  id: string;
  category: string;
  status: string;
  created_at: string;
};

type Permit = {
  id: string;
  applicant_name: string;
  application_status: string;
  submitted_at: string | null;
};

type Schedule = {
  id: string;
  barangay: string;
  collection_time: string;
  truck_id: string | null;
};

type Activity = {
  id: string;
  title: string;
  type: "Complaint" | "Permit";
  date: string;
  status: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!user.email_confirmed_at) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Your email address has not been confirmed yet. Please verify your email or click below to resend the confirmation link."
        )
    );
  }

  const [
    { data: profile },
    { data: complaints },
    { data: permits },
    { data: schedules, error: schedulesError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("complaints")
      .select("id, category, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("permit_applications")
      .select("id, applicant_name, application_status, submitted_at")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("collection_schedules")
      .select("id, barangay, collection_time, truck_id")
      .order("collection_time", { ascending: true }),
  ]);

  if (profile?.role === "admin") redirect("/admin");

  const complaintItems = (complaints ?? []) as Complaint[];
  const permitItems = (permits ?? []) as Permit[];
  const scheduleItems = (schedules ?? []) as Schedule[];

  const name =
    profile?.full_name || user.user_metadata?.full_name || "Resident";

  const activity: Activity[] = [
    ...complaintItems.map((item) => ({
      id: item.id,
      title: item.category,
      type: "Complaint" as const,
      date: item.created_at,
      status: item.status,
    })),
    ...permitItems.map((item) => ({
      id: item.id,
      title: item.applicant_name ? `${item.applicant_name} (Tree Cutting)` : "Tree Cutting Permit",
      type: "Permit" as const,
      date: item.submitted_at ?? "",
      status: item.application_status,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <AppShell
      mode="resident"
      userName={name}
      email={profile?.email ?? user.email}
      avatarUrl={profile?.avatar_url || user.user_metadata?.avatar_url || null}
    >
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <p className="eyebrow">RESIDENT PORTAL • MABINI, BATANGAS</p>
          <h1 className="page-title">Resident Dashboard</h1>
          <p className="page-subtitle">
            A clear view of your environmental requests and community services.
          </p>
        </div>
      </div>

      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div>
          <p className="banner-eyebrow">WELCOME BACK</p>
          <h2>GOOD DAY, {name.toUpperCase()}.</h2>
          <p>
            Stay informed and make a positive impact in your local community.
          </p>
        </div>
        <Link className="button banner-button" href="/complaints/new">
          <Plus size={16} aria-hidden="true" /> Submit New Report
        </Link>
      </section>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <Stat
          label="TOTAL FILED"
          value={complaintItems.length}
          icon={<FileText size={18} aria-hidden="true" />}
          tone="filed"
        />
        <Stat
          label="PENDING"
          value={countStatus(complaintItems, "Pending")}
          icon={<Timer size={18} aria-hidden="true" />}
          tone="pending"
        />
        <Stat
          label="UNDER REVIEW"
          value={countStatus(complaintItems, "Under Review")}
          icon={<Clock3 size={18} aria-hidden="true" />}
          tone="review"
        />
        <Stat
          label="RESOLVED"
          value={countStatus(complaintItems, "Resolved")}
          icon={<CheckCircle2 size={18} aria-hidden="true" />}
          tone="resolved"
        />
      </div>

      {/* Content Grid: Recent Activity (Left) & Quick Actions + Schedules (Right Stack) */}
      <div className="content-grid">
        {/* Left Column: Recent Complaint Activity */}
        <section className="card">
          <div className="card-title">
            <div>
              <h2>Recent Complaint Activity</h2>
              <p className="hint">
                Track status updates directly from the MENR Office.
              </p>
            </div>
            <Link className="text-link" href="/complaints">
              View All <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          {activity.length === 0 ? (
            <div className="empty-state">
              You have no recent complaints or permit applications.
            </div>
          ) : (
            <div className="activity-list">
              {activity.map((item) => (
                <Link
                  className="activity-row"
                  href={item.type === "Complaint" ? "/complaints" : "/permits"}
                  key={`${item.type}-${item.id}`}
                >
                  <span
                    className={`activity-icon ${item.type.toLowerCase()}`}
                  >
                    {item.type === "Complaint" ? (
                      <MessageSquare size={17} aria-hidden="true" />
                    ) : (
                      <FileCheck2 size={17} aria-hidden="true" />
                    )}
                  </span>
                  <div className="activity-copy">
                    <strong>{item.title}</strong>
                    <small>
                      {item.type} · Ref ID: {item.id.slice(0, 8)}…
                    </small>
                  </div>
                  <span className="activity-date">
                    {item.date
                      ? new Date(item.date).toLocaleDateString()
                      : "Date unavailable"}
                  </span>
                  <span className={`badge ${statusClass(item.status)}`}>
                    {item.status}
                  </span>
                  <ArrowRight
                    className="activity-arrow"
                    size={15}
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Right Column Stack: Quick Actions & Compact Schedule Preview */}
        <div className="dashboard-right-stack">
          {/* Quick Actions */}
          <aside className="card">
            <div className="card-title">
              <div>
                <h2>Quick Actions</h2>
                <p className="hint">Start an environmental service request.</p>
              </div>
            </div>
            <div className="quick-actions">
              <Link href="/complaints/new" className="quick-action">
                <span className="stat-icon quick-action-icon complaint">
                  <Plus size={17} aria-hidden="true" />
                </span>
                <div>
                  <strong>Report an Issue</strong>
                  <small>Submit an illegal dumping or environmental concern</small>
                </div>
                <ArrowRight size={15} className="quick-action-arrow" aria-hidden="true" />
              </Link>

              <Link href="/permits/new" className="quick-action">
                <span className="stat-icon quick-action-icon permit">
                  <FileCheck2 size={17} aria-hidden="true" />
                </span>
                <div>
                  <strong>Apply for Permit</strong>
                  <small>Submit a tree cutting permit application</small>
                </div>
                <ArrowRight size={15} className="quick-action-arrow" aria-hidden="true" />
              </Link>

              <Link href="/schedules" className="quick-action">
                <span className="stat-icon quick-action-icon schedule">
                  <CalendarDays size={17} aria-hidden="true" />
                </span>
                <div>
                  <strong>View All Schedules</strong>
                  <small>Check full municipality waste collection dates</small>
                </div>
                <ArrowRight size={15} className="quick-action-arrow" aria-hidden="true" />
              </Link>
            </div>
          </aside>

          {/* Compact Garbage Collection Schedule Preview */}
          <section className="card dashboard-schedule-compact">
            <div className="card-title" style={{ marginBottom: "12px" }}>
              <div>
                <h2 style={{ fontSize: "16px" }}>Garbage Collection Schedule</h2>
                <p className="hint">Next upcoming neighborhood pickups</p>
              </div>
              <Link className="text-link" href="/schedules">
                View All <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>

            {schedulesError ? (
              <div className="notice error" style={{ fontSize: "12.5px", padding: "10px" }}>
                Unable to load collection schedules right now.
              </div>
            ) : scheduleItems.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 14px", fontSize: "13px" }}>
                No collection schedules are published yet. Check back soon.
              </div>
            ) : (
              <div className="compact-schedule-list">
                {scheduleItems.slice(0, 3).map((schedule) => (
                  <div className="compact-schedule-item" key={schedule.id}>
                    <div className="compact-schedule-header">
                      <span className="compact-schedule-badge">
                        <MapPin size={13} color="var(--primary-green)" aria-hidden="true" />
                        <span>{schedule.barangay}</span>
                      </span>
                      {schedule.truck_id && (
                        <span className="compact-schedule-truck">
                          <Truck size={11} aria-hidden="true" />
                          <span>{schedule.truck_id}</span>
                        </span>
                      )}
                    </div>

                    <div className="compact-schedule-meta">
                      <span>
                        <CalendarDays size={13} color="var(--primary-green)" aria-hidden="true" />
                        <strong>{new Date(schedule.collection_time).toLocaleDateString()}</strong>
                      </span>
                      <span>
                        <Clock3 size={13} color="var(--primary-green)" aria-hidden="true" />
                        <span>
                          {new Date(schedule.collection_time).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}

                <Link
                  href="/schedules"
                  className="compact-schedule-view-all-btn"
                >
                  <span>View Full Municipal Schedule</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function countStatus(items: Complaint[], status: string) {
  return items.filter((item) => item.status === status).length;
}

function statusClass(status: string) {
  return status.toLowerCase().replaceAll(" ", "-");
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
