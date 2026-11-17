import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import ProfileForm from "./ProfileForm";
import { ArrowLeft, ShieldCheck, User } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <AppShell mode="resident" userName="User" email={user.email}>
        <div className="notice error">
          Unable to load your account settings.
        </div>
      </AppShell>
    );
  }

  const role = profile?.role === "admin" ? "Administrator" : "Resident";
  const name = profile?.full_name || user.user_metadata?.full_name || "";
  const email = profile?.email || user.email || "Email unavailable";
  const isAdmin = profile?.role === "admin";

  return (
    <AppShell
      mode={isAdmin ? "admin" : "resident"}
      userName={name || role}
      email={email}
    >
      <div className="form-page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">{isAdmin ? "MENR OPERATIONS" : "RESIDENT PORTAL"}</p>
            <h1 className="page-title">Account Settings</h1>
            <p className="page-subtitle">
              Manage your personal profile information and view account privileges.
            </p>
          </div>
          <div className="page-header-actions">
            <Link
              className="button secondary"
              href={isAdmin ? "/admin" : "/dashboard"}
            >
              <ArrowLeft size={16} aria-hidden="true" /> Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="settings-grid">
        <section className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "var(--light-green)",
                  color: "var(--primary-green)",
                  borderRadius: "8px",
                  padding: "8px",
                  display: "flex",
                }}
              >
                <User size={18} aria-hidden="true" />
              </div>
              <div>
                <h2>Profile Information</h2>
                <p className="hint">Update your display name across EcoGuard.</p>
              </div>
            </div>
          </div>
          <ProfileForm fullName={name} />
        </section>

        <aside className="card account-summary">
          <div className="account-summary-icon">
            <ShieldCheck size={22} aria-hidden="true" />
          </div>
          <h2>Account Details</h2>
          <dl>
            <div>
              <dt>Registered Email</dt>
              <dd>{email}</dd>
            </div>
            <div>
              <dt>System Role</dt>
              <dd>
                <span className="badge resolved">{role}</span>
              </dd>
            </div>
          </dl>
          <p className="hint">
            Your email address and assigned role are protected under municipal security policies and can only be altered by authorized MENR administrators.
          </p>
        </aside>
      </div>
      </div>
    </AppShell>
  );
}
