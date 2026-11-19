import Link from "next/link";
import { ArrowLeft, CircleHelp, FileText, Info, MapPin, ShieldCheck } from "lucide-react";
import { MENR_OFFICE_INFO } from "@/lib/mabini-constants";

export const metadata = {
  title: "Support & Help Center | EcoGuard Mabini",
  description: "Official support, FAQs, Privacy Policy, and MENR Office information for EcoGuard Mabini.",
};

export default function SupportHubPage() {
  return (
    <div className="support-page-container">
      {/* Top Breadcrumb & Navigation */}
      <div className="support-header">
        <Link href="/dashboard" className="button secondary sm">
          <ArrowLeft size={15} aria-hidden="true" /> Back to Resident Portal
        </Link>
        <span className="eyebrow" style={{ margin: 0 }}>MABINI, BATANGAS • MENR OFFICE</span>
      </div>

      {/* Hero Banner */}
      <div className="support-hero">
        <div className="support-hero-badge">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>EcoGuard Help & Governance</span>
        </div>
        <h1>Support Center & Resources</h1>
        <p>
          Find answers to common questions about environmental complaints, tree cutting permits, waste collection schedules, and municipal data privacy.
        </p>
      </div>

      {/* Main Grid: 3 Pillars */}
      <div className="support-cards-grid">
        {/* Card 1: FAQs */}
        <Link href="/support/faq" className="support-nav-card">
          <div className="support-nav-icon">
            <CircleHelp size={24} aria-hidden="true" />
          </div>
          <h2>Frequently Asked Questions</h2>
          <p>
            Step-by-step guides on filing complaints, required permit documents, garbage collection schedules, and account settings.
          </p>
          <span className="support-card-link">Browse FAQs →</span>
        </Link>

        {/* Card 2: Privacy Policy */}
        <Link href="/support/privacy" className="support-nav-card">
          <div className="support-nav-icon">
            <FileText size={24} aria-hidden="true" />
          </div>
          <h2>Privacy Policy</h2>
          <p>
            Draft governance policy under the Philippine Data Privacy Act of 2012 (RA 10173), covering data retention, evidence storage, and user rights.
          </p>
          <span className="support-card-link">Read Privacy Policy →</span>
        </Link>

        {/* Card 3: About EcoGuard */}
        <Link href="/support/about" className="support-nav-card">
          <div className="support-nav-icon">
            <Info size={24} aria-hidden="true" />
          </div>
          <h2>About EcoGuard</h2>
          <p>
            Learn about the purpose, capstone project background, and digital environmental services developed for the MENR Office of Mabini.
          </p>
          <span className="support-card-link">About the System →</span>
        </Link>
      </div>

      {/* Contact Section */}
      <div className="card" style={{ marginTop: "32px", padding: "24px" }}>
        <h2 style={{ fontSize: "18px", color: "var(--dark-forest)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <MapPin size={18} style={{ color: "var(--primary-green)" }} />
          Contact the MENR Office
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "13.5px", margin: "0 0 16px", lineHeight: 1.5 }}>
          If you have an urgent inquiry, need in-person document validation, or require assistance beyond digital self-service, please visit or contact the office directly:
        </p>

        <div className="support-contact-grid">
          <div>
            <strong style={{ display: "block", color: "var(--text-main)", fontSize: "12.5px" }}>Office Location</strong>
            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{MENR_OFFICE_INFO.address}</span>
          </div>

          <div>
            <strong style={{ display: "block", color: "var(--text-main)", fontSize: "12.5px" }}>Office Hours</strong>
            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{MENR_OFFICE_INFO.hours}</span>
          </div>

          <div>
            <strong style={{ display: "block", color: "var(--text-main)", fontSize: "12.5px" }}>Official Inquiries</strong>
            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{MENR_OFFICE_INFO.email}</span>
          </div>
        </div>

        <div className="notice warning sm" style={{ marginTop: "18px" }}>
          <strong>Emergency Hazards:</strong> {MENR_OFFICE_INFO.emergencyNote}
        </div>
      </div>
    </div>
  );
}
