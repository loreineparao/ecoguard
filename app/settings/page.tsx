import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import EmailSettingsForm from "./EmailSettingsForm";
import PasswordSettingsForm from "./PasswordSettingsForm";
import AppearanceSettingsSection from "./AppearanceSettingsSection";
import PrivacySettingsSection from "./PrivacySettingsSection";
import DeleteAccountSection from "./DeleteAccountSection";
import {
  ArrowLeft,
  ShieldCheck,
  User,
  HelpCircle,
  Shield,
  ArrowRight,
  Lock,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Settings | EcoGuard Account Management",
  description: "Manage your account, security, appearance, and privacy preferences on EcoGuard.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile row
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role === "admin" ? "Administrator" : "Resident";
  const name = profile?.full_name || user.user_metadata?.full_name || "";
  const email = user.email || profile?.email || "Email unavailable";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null;
  const deletionStatus = profile?.deletion_status || user.user_metadata?.account_deletion_request?.status || null;
  const isAdmin = profile?.role === "admin";

  return (
    <AppShell
      mode={isAdmin ? "admin" : "resident"}
      userName={name || (isAdmin ? "MENR Administrator" : "Resident")}
      email={email}
      avatarUrl={avatarUrl}
    >
      <div className="form-page-container settings-container">
        {/* Page Top Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">{isAdmin ? "MENR OPERATIONS" : "ACCOUNT MANAGEMENT"}</p>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">
              Manage your account, security, appearance, and privacy preferences.
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

        {/* Resident Profile Banner Notice */}
        {!isAdmin && (
          <div className="card profile-shortcut-banner" style={{ marginBottom: "20px", padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "var(--light-green)",
                    color: "var(--primary-green)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <User size={20} aria-hidden="true" />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "14px", color: "var(--dark-forest)" }}>
                    Personal Profile &amp; Photo Editing
                  </strong>
                  <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                    Update your full name, profile photo, contact number, and registered Mabini barangay in Profile Information.
                  </span>
                </div>
              </div>

              <Link href="/profile" className="button green sm">
                Edit Profile Information <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}

        <div className="settings-grid">
          {/* Main Left Column: Account Settings Sections */}
          <div className="settings-main-col">
            {/* Section A: Security & Account Access */}
            <section className="card settings-card" id="account-access">
              <div className="card-title">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="settings-card-icon-badge">
                    <Shield size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <h2>Account Access &amp; Email</h2>
                    <p className="hint">
                      Your authenticated email address and credential communication settings.
                    </p>
                  </div>
                </div>
              </div>

              <EmailSettingsForm currentEmail={email} />
            </section>

            {/* Section B: Security & Password */}
            <section className="card settings-card" id="password-security">
              <PasswordSettingsForm userEmail={email} />
            </section>

            {/* Section C: Appearance & Accessibility */}
            <section className="card settings-card" id="appearance">
              <AppearanceSettingsSection />
            </section>

            {/* Section D: Privacy & Data */}
            <section className="card settings-card" id="privacy-data">
              <PrivacySettingsSection />
            </section>

            {/* Section E: Delete Account */}
            <section className="card settings-card" id="delete-account">
              <DeleteAccountSection
                userRole={role}
                initialDeletionStatus={deletionStatus}
              />
            </section>
          </div>

          {/* Right Aside Column: Account Summary & Navigation */}
          <div className="settings-side-col">
            <aside className="card account-summary">
              <div className="account-summary-icon">
                <ShieldCheck size={22} aria-hidden="true" />
              </div>
              <h2>Account Status</h2>
              <dl>
                <div>
                  <dt>Registered Email</dt>
                  <dd style={{ wordBreak: "break-all" }}>{email}</dd>
                </div>
                <div>
                  <dt>System Role</dt>
                  <dd>
                    <span className="badge resolved">{role}</span>
                  </dd>
                </div>
                <div>
                  <dt>Session Security</dt>
                  <dd style={{ fontSize: "12px", color: "var(--primary-green)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <LockKeyhole size={13} />
                    SSL 256-Bit Encrypted
                  </dd>
                </div>
                <div>
                  <dt>Account ID</dt>
                  <dd style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                    {user.id}
                  </dd>
                </div>
              </dl>
              <p className="hint" style={{ fontSize: "11.5px", lineHeight: 1.5 }}>
                {isAdmin
                  ? "Municipal officer credentials and administrative actions are logged for governance audit compliance."
                  : "Your account privileges and submitted records are encrypted and protected under municipal security guidelines."}
              </p>
            </aside>

            {/* Resident Profile Quick Link Card */}
            {!isAdmin && (
              <div className="card" style={{ marginTop: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <User size={16} style={{ color: "var(--primary-green)" }} />
                  <h3 style={{ fontSize: "13.5px", margin: 0, color: "var(--dark-forest)" }}>Resident Profile</h3>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 12px" }}>
                  View your verified residency certificate, barangay location, and update your avatar photo.
                </p>
                <Link
                  href="/profile"
                  className="button secondary sm"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Go to Profile Information →
                </Link>
              </div>
            )}

            {/* Support & FAQs Card */}
            <div className="card" style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <HelpCircle size={17} style={{ color: "var(--primary-green)" }} />
                <h3 style={{ fontSize: "14px", margin: 0, color: "var(--dark-forest)" }}>Support &amp; FAQs</h3>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                <li>
                  <Link
                    href="/support/faq"
                    style={{ fontSize: "12.5px", color: "var(--primary-green)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    Frequently Asked Questions (FAQ) →
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support/privacy"
                    style={{ fontSize: "12.5px", color: "var(--primary-green)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    Privacy Policy (Data Privacy Act) →
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    style={{ fontSize: "12.5px", color: "var(--primary-green)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    About EcoGuard &amp; MENR Mabini →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
