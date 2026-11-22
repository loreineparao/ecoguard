import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import AccountInformationSection from "./AccountInformationSection";
import PasswordSettingsForm from "./PasswordSettingsForm";
import DeactivateAccountSection from "./DeactivateAccountSection";
import AppearanceSettingsSection from "./AppearanceSettingsSection";
import { ArrowLeft, HelpCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Settings | EcoGuard Account Management",
  description: "Manage your account information, security credentials, appearance, and municipal preferences.",
};

export default async function SettingsPage() {
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

  // Fetch profile row
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // If the profile is marked deactivated or missing, reject access immediately
  const isDeactivated =
    !profile ||
    profile.deletion_status === "deactivated" ||
    profile.deletion_status === "deleted" ||
    user.app_metadata?.account_status === "deactivated" ||
    user.user_metadata?.account_status === "deactivated";

  if (isDeactivated) {
    redirect("/login?error=" + encodeURIComponent("Your account has been deactivated. Please contact the MENR Office."));
  }

  const role = profile?.role === "admin" ? "Administrator" : "Resident";
  const name = profile?.full_name || user.user_metadata?.full_name || "";
  const email = user.email || profile?.email || "Email unavailable";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null;
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
              Manage your account information, security credentials, appearance, and municipal preferences.
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
          {/* Main Left Column (Exact order: 1. Account Info, 2. Password & Security, 3. Deactivate Account) */}
          <div className="settings-main-col">
            {/* 1. Account Information */}
            <section className="card settings-card" id="account-info">
              <AccountInformationSection
                email={email}
                role={role}
                userId={user.id}
                isAdmin={isAdmin}
              />
            </section>

            {/* 2. Password & Security */}
            <section className="card settings-card" id="password-security">
              <PasswordSettingsForm userEmail={email} />
            </section>

            {/* 3. Deactivate Account */}
            <section className="card settings-card" id="deactivate-account">
              <DeactivateAccountSection
                userRole={role}
                userEmail={email}
              />
            </section>
          </div>

          {/* Right Aside Column (Exact order: 1. Appearance & Theme, 2. Quick Navigation) */}
          <div className="settings-side-col">
            {/* 1. Appearance & Theme (Replaced redundant Account Status) */}
            <section id="appearance-theme">
              <AppearanceSettingsSection />
            </section>

            {/* 2. Quick Navigation */}
            <div className="card" style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <HelpCircle size={17} style={{ color: "var(--primary-green)" }} />
                <h3 style={{ fontSize: "14px", margin: 0, color: "var(--dark-forest)" }}>Quick Navigation</h3>
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
