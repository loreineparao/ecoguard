import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import ProfileAvatarEditor from "./ProfileAvatarEditor";
import ProfileDetailsForm from "./ProfileDetailsForm";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Settings,
  HelpCircle,
  Building2,
  Lock,
} from "lucide-react";

export const metadata = {
  title: "Profile Information | EcoGuard Resident Portal",
  description: "View and edit your personal profile information, photo, and Mabini resident verification status.",
};

export default async function ProfilePage() {
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

  // Fetch resident profile from Supabase
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role === "admin" ? "Administrator" : "Resident";
  const name = profile?.full_name || user.user_metadata?.full_name || "EcoGuard Resident";
  const email = user.email || profile?.email || "";
  const barangay = profile?.barangay || user.user_metadata?.barangay || "";
  const address = profile?.address || user.user_metadata?.address || "";
  const contactNumber = profile?.contact_number || user.user_metadata?.contact_number || "";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null;
  const isAdmin = profile?.role === "admin";

  return (
    <AppShell
      mode={isAdmin ? "admin" : "resident"}
      userName={name}
      email={email}
      avatarUrl={avatarUrl}
    >
      <div className="form-page-container profile-container">
        {/* Page Top Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">{isAdmin ? "ADMIN WORKSPACE" : "RESIDENT PORTAL"}</p>
            <h1 className="page-title">Profile Information</h1>
            <p className="page-subtitle">
              Manage your profile photo, personal information, and certified Mabini resident verification.
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
          {/* Main Column: TikTok-styled Profile Editor */}
          <div className="settings-main-col">
            <section className="card tiktok-profile-card">
              {/* Centered Avatar with Camera Badge */}
              <ProfileAvatarEditor
                currentAvatarUrl={avatarUrl}
                userName={name}
              />

              {/* Personal Information Rows & Verification Badge */}
              <ProfileDetailsForm
                initialFullName={name}
                email={email}
                initialBarangay={barangay}
                initialAddress={address}
                initialContactNumber={contactNumber}
                userRole={role}
              />
            </section>
          </div>

          {/* Right Column: Security & Support shortcuts */}
          <div className="settings-side-col">
            {/* Quick Links Card */}
            <div className="card" style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Settings size={17} style={{ color: "var(--primary-green)" }} />
                <h3 style={{ fontSize: "14px", margin: 0, color: "var(--dark-forest)" }}>Account Settings</h3>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 14px" }}>
                Need to change your password, update appearance preferences, or review data privacy settings?
              </p>
              <Link
                href="/settings"
                className="button secondary sm"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Lock size={14} aria-hidden="true" />
                Go to Settings
              </Link>
            </div>

            {/* Support Hub Card */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <HelpCircle size={17} style={{ color: "var(--primary-green)" }} />
                <h3 style={{ fontSize: "14px", margin: 0, color: "var(--dark-forest)" }}>Need Help?</h3>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 12px" }}>
                Learn more about your resident privileges or how complaint data is handled by the MENR Office.
              </p>
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
                    Privacy Policy &amp; RA 9003 Notice →
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    style={{ fontSize: "12.5px", color: "var(--primary-green)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    About EcoGuard Mabini →
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
