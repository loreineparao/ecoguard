import Link from "next/link";
import { ArrowLeft, FileText, AlertTriangle } from "lucide-react";
import { MENR_OFFICE_INFO } from "@/lib/mabini-constants";

export const metadata = {
  title: "Privacy Policy | EcoGuard Mabini",
  description: "Draft Data Privacy Policy for EcoGuard under the Philippine Data Privacy Act of 2012 (RA 10173).",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="support-page-container">
      {/* Navigation */}
      <div className="support-header">
        <Link href="/support" className="button secondary sm">
          <ArrowLeft size={15} aria-hidden="true" /> Back to Support Hub
        </Link>
        <span className="eyebrow" style={{ margin: 0 }}>MABINI, BATANGAS • DATA GOVERNANCE</span>
      </div>

      {/* Hero */}
      <div className="support-hero">
        <div className="support-hero-badge">
          <FileText size={16} aria-hidden="true" />
          <span>Legal Context: Republic Act No. 10173</span>
        </div>
        <h1>Privacy Policy</h1>
        <p>
          Standards and guidelines governing the collection, processing, storage, and retention of personal data within the EcoGuard environmental portal.
        </p>
      </div>

      {/* Prominent Draft Notice */}
      <div className="policy-draft-notice" role="note" aria-label="Draft Policy Notice">
        <div className="policy-draft-notice-header">
          <AlertTriangle size={22} className="policy-draft-notice-icon" aria-hidden="true" />
          <div>
            <strong className="policy-draft-notice-title">
              DRAFT POLICY NOTICE — FOR MENR &amp; LGU REVIEW
            </strong>
            <p className="policy-draft-notice-text">
              This document is a comprehensive draft prepared in accordance with the <strong>Philippine Data Privacy Act of 2012 (Republic Act No. 10173)</strong> for the EcoGuard capstone project. It is intended for formal review, amendment, and official adoption by the <strong>Municipal Environment and Natural Resources Office (MENR)</strong> and the <strong>Municipal Government of Mabini, Batangas</strong>. Nothing herein constitutes final municipal ordinance or legal counsel until officially enacted.
            </p>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <article className="policy-document card">
        {/* Section 1 */}
        <section className="policy-section">
          <h2>1. Overview and Scope</h2>
          <p>
            The Municipal Environment and Natural Resources Office (MENR) of Mabini, Batangas values the privacy and data protection rights of its residents. This policy sets forth how EcoGuard collects, uses, protects, and handles personal information, uploaded evidence, and property documents when residents interact with our digital environmental services.
          </p>
        </section>

        {/* Section 2 */}
        <section className="policy-section">
          <h2>2. Personal Information Collected</h2>
          <p>EcoGuard collects only the personal data necessary to identify applicants, investigate environmental concerns, and deliver public services:</p>
          <ul>
            <li><strong>Account Credentials:</strong> Full name, verified email address, hashed authentication credentials, and user identifier.</li>
            <li><strong>Resident Profile Information:</strong> Barangay of residence, residential address (street/sitio), and mobile contact number.</li>
            <li><strong>Complaint Evidence &amp; Incident Information:</strong> Description of environmental violation, date and time, uploaded photographs of the scene, and geographic location coordinates or descriptive landmarks.</li>
            <li><strong>Permit Application Documentation:</strong> Proof of land ownership or land title, formal application letter, Barangay Clearance, Barangay Resolution of No Objection, and site photographs of the trees requested for cutting.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="policy-section">
          <h2>3. Purpose and Legal Basis of Processing</h2>
          <p>All data processing conducted through EcoGuard adheres to the principles of transparency, legitimate purpose, and proportionality under RA 10173:</p>
          <ul>
            <li>To verify the identity of individuals filing municipal environmental reports or applying for statutory forestry permits.</li>
            <li>To enable MENR field officers to locate, inspect, and mitigate illegal dumping sites and hazardous waste.</li>
            <li>To evaluate compliance with DENR regulations, the Revised Forestry Code of the Philippines (PD 705), and the Ecological Solid Waste Management Act (RA 9003).</li>
            <li>To coordinate waste collection dispatching and generate aggregated statistical reports for municipal environmental planning.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="policy-section">
          <h2>4. Geolocation Data and Photographic Evidence</h2>
          <p>
            When submitting an environmental complaint, residents are prompted to capture their GPS coordinates. This geolocation data is strictly utilized to map the incident within the municipal boundary of Mabini and dispatch inspection personnel. Uploaded photographic evidence is stored in secure, private storage and accessible only to the filing resident and authorized MENR administrators.
          </p>
        </section>

        {/* Section 5 */}
        <section className="policy-section">
          <h2>5. Tree Cutting Permit Documents</h2>
          <p>
            Statutory documents uploaded during permit applications (such as Land Titles and Barangay Clearances) contain sensitive property details. These documents are stored in restricted private storage buckets protected by PostgreSQL Row Level Security (RLS). They are never shared publicly and are viewed solely by designated MENR permit evaluators for verification.
          </p>
        </section>

        {/* Section 6 */}
        <section className="policy-section">
          <h2>6. Data Storage, Security, and Access Controls</h2>
          <p>EcoGuard employs multi-layer security measures to safeguard resident records:</p>
          <ul>
            <li><strong>Encryption in Transit and at Rest:</strong> All data transmissions are encrypted using Transport Layer Security (TLS 1.3), and database volumes are encrypted at rest.</li>
            <li><strong>Row Level Security (RLS):</strong> Database-level access policies ensure that residents can only view and modify their own complaints, permit documents, and profile details.</li>
            <li><strong>Role-Based Administrative Controls:</strong> Administrative privileges are strictly confined to vetted MENR staff requiring access for official duties.</li>
            <li><strong>No Plaintext Passwords:</strong> Passwords are cryptographically salted and hashed using industry-standard algorithms managed by Supabase Auth; plaintext passwords are never logged or stored.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="policy-section">
          <h2>7. Municipal Data Retention and Audit Obligations</h2>
          <p>
            Under Philippine public records guidelines and environmental statutes (RA 9003 and PD 705), submitted complaint logs, municipal inspection findings, and forestry permit records constitute official government transactions. Consequently, while personal credentials may be deactivated upon resident request, historical complaints, dispatched records, and permit decisions must be archived for legitimate municipal audit, legal, and operational continuity purposes.
          </p>
        </section>

        {/* Section 8 */}
        <section className="policy-section">
          <h2>8. Account Deletion and Records Retention</h2>
          <p>
            Residents have the right to request the permanent deletion of their EcoGuard account at any time via Account Settings. Upon confirming account deletion:
          </p>
          <ul>
            <li>Authentication credentials and active login sessions are permanently terminated and deleted from the authentication directory.</li>
            <li>Personal contact numbers, residential addresses, and avatar images are permanently scrubbed and removed from active profiles.</li>
            <li>In accordance with public records regulations and environmental governance mandates (RA 9003 and PD 705), official complaints, inspection records, and permit applications submitted to the MENR Office are disassociated from personal identities and retained for municipal audit, legal, and operational continuity.</li>
          </ul>
        </section>

        {/* Section 9 */}
        <section className="policy-section">
          <h2>9. Rights of the Data Subject</h2>
          <p>In accordance with Chapter IV of Republic Act No. 10173, residents possess the following rights:</p>
          <ul>
            <li><strong>Right to be Informed:</strong> To know what personal data is being collected and how it will be processed.</li>
            <li><strong>Right to Access:</strong> To view all personal profile data, complaints, and permits submitted through the portal.</li>
            <li><strong>Right to Rectification:</strong> To update inaccurate, outdated, or incomplete profile details via the Edit Profile section.</li>
            <li><strong>Right to Object &amp; Erasure:</strong> To request account deactivation and anonymization subject to statutory record-retention laws.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section className="policy-section">
          <h2>10. Inquiries and Data Protection Contact</h2>
          <p>
            For inquiries regarding this draft policy, data subject requests, or municipal privacy practices, please visit the MENR Office in person during regular operating hours:
          </p>
          <div className="policy-contact-box">
            <strong>Municipal Environment and Natural Resources Office (MENR)</strong>
            <span>{MENR_OFFICE_INFO.address}</span>
            <span>Office Hours: {MENR_OFFICE_INFO.hours}</span>
          </div>
        </section>
      </article>

      {/* Footer Nav */}
      <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "space-between", flexWrap: "wrap" }}>
        <Link href="/support/faq" className="button secondary sm">
          ← Frequently Asked Questions
        </Link>
        <Link href="/about" className="button green sm">
          About EcoGuard →
        </Link>
      </div>
    </div>
  );
}
