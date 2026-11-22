import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, TreePine, MessageSquare, Truck, Bot, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "About EcoGuard | Environmental Management Portal",
  description: "Learn about EcoGuard: An AI-Enabled Environmental Complaint and Service Management System for the MENR Office in Mabini, Batangas.",
};

export default function AboutPage() {
  return (
    <div className="support-page-container">
      {/* Navigation */}
      <div className="support-header">
        <Link href="/support" className="button secondary sm">
          <ArrowLeft size={15} aria-hidden="true" /> Back to Support Hub
        </Link>
        <span className="eyebrow" style={{ margin: 0 }}>MABINI, BATANGAS • SYSTEM OVERVIEW</span>
      </div>

      {/* Hero */}
      <div className="support-hero">
        <div className="support-hero-badge">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Capstone Research &amp; Municipal Innovation</span>
        </div>
        <h1>About EcoGuard</h1>
        <p>
          An AI-Enabled Web-Based Environmental Complaint and Service Management System developed for the MENR Office in the Municipality of Mabini, Batangas.
        </p>
      </div>

      {/* Project Background & LGU Seal */}
      <section className="card" style={{ marginTop: "24px", padding: "28px" }}>
        <div className="about-seal-grid">
          <div className="about-seal-col">
            <Image
              src="/images/mabini-logo.png"
              alt="Official Seal of the Municipality of Mabini, Batangas"
              width={180}
              height={180}
              style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }}
              priority
            />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", display: "block", marginTop: "8px" }}>
              Municipality of Mabini, Batangas
            </span>
          </div>

          <div className="about-intro-col">
            <span className="eyebrow">ACADEMIC RESEARCH &amp; COMMUNITY COLLABORATION</span>
            <h2 style={{ fontSize: "20px", color: "var(--dark-forest)", margin: "0 0 12px" }}>
              Modernizing Environmental Governance in Mabini
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, margin: "0 0 12px" }}>
              The Municipality of Mabini, located in the Province of Batangas, is celebrated globally for its pristine marine biodiversity and lush coastal ecosystems. Preserving this unique natural heritage requires responsive community engagement and transparent municipal governance.
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              <strong>EcoGuard</strong> bridges the communication gap between Mabini residents and the <strong>Municipal Environment and Natural Resources Office (MENR)</strong>. By transforming previously paper-based complaint filing and manual forestry clearance processes into a unified, transparent web portal, EcoGuard expedites municipal response times and reinforces environmental protection.
            </p>
          </div>
        </div>

        {/* Academic Notice */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "14px 18px",
            marginTop: "20px",
            fontSize: "12.5px",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "var(--dark-forest)" }}>Capstone Project Notice: </strong>
          EcoGuard was developed as an undergraduate capstone research study for <strong>Batangas State University</strong> in academic demonstration and operational modeling for the MENR Office of Mabini, Batangas. It showcases the integration of Next.js 16, Supabase cloud infrastructure, and Google Gemini AI assistance in local government unit (LGU) public service administration.
        </div>
      </section>

      {/* Core Modules Grid */}
      <section style={{ marginTop: "32px" }}>
        <h2 style={{ fontSize: "20px", color: "var(--dark-forest)", marginBottom: "16px" }}>
          Core System Capabilities
        </h2>

        <div className="about-modules-grid">
          {/* Module 1: Complaint Management (Illegal Dumping Only) */}
          <div className="card about-module-card">
            <div className="about-module-icon">
              <MessageSquare size={22} aria-hidden="true" />
            </div>
            <h3>Environmental Complaint Reporting</h3>
            <p>
              Allows residents to report illegal dumping incidents with photographic evidence and geotagged incident locations. Residents can track complaint investigation status as MENR field officers verify and address the violation.
            </p>
          </div>

          {/* Module 2: Tree Cutting Permits */}
          <div className="card about-module-card">
            <div className="about-module-icon">
              <TreePine size={22} aria-hidden="true" />
            </div>
            <h3>Tree-Cutting Permit Applications</h3>
            <p>
              Enables residents to submit tree-cutting permit applications and upload required supporting documents (such as land titles and barangay clearances) for formal administrative review and scheduling of physical site inspection by MENR personnel.
            </p>
          </div>

          {/* Module 3: Garbage Collection Scheduling */}
          <div className="card about-module-card">
            <div className="about-module-icon">
              <Truck size={22} aria-hidden="true" />
            </div>
            <h3>Garbage Collection Schedules</h3>
            <p>
              Allows residents to view official solid waste collection days, routes, and designated pickup windows published and updated by the MENR Office across all 34 Mabini barangays.
            </p>
          </div>

          {/* Module 4: AI Assistant */}
          <div className="card about-module-card">
            <div className="about-module-icon">
              <Bot size={22} aria-hidden="true" />
            </div>
            <h3>Google Gemini AI Assistant</h3>
            <p>
              An AI-powered service guidance tool that helps residents understand municipal environmental guidelines, clarify required permit documents, and navigate directly to the appropriate complaint or application forms.
            </p>
          </div>
        </div>
      </section>

      {/* Summary of Technology */}
      <section className="card" style={{ marginTop: "32px", padding: "24px" }}>
        <h2 style={{ fontSize: "18px", color: "var(--dark-forest)", margin: "0 0 12px" }}>
          Technology &amp; Security Architecture
        </h2>
        <ul className="about-tech-list">
          <li>
            <CheckCircle2 size={16} className="text-green" />
            <span><strong>Next.js 16 App Router &amp; TypeScript:</strong> Modern, responsive server-side rendered web portal ensuring high accessibility across mobile and desktop.</span>
          </li>
          <li>
            <CheckCircle2 size={16} className="text-green" />
            <span><strong>Supabase PostgreSQL &amp; RLS:</strong> Encrypted relational database with row-level security guaranteeing private, authorized-only access to resident records.</span>
          </li>
          <li>
            <CheckCircle2 size={16} className="text-green" />
            <span><strong>Google Gemini API:</strong> Context-aware natural language processing for environmental concern classification and resident inquiries.</span>
          </li>
          <li>
            <CheckCircle2 size={16} className="text-green" />
            <span><strong>Cloud Infrastructure on Vercel:</strong> Continuous integration and high-availability hosting deployed for the Municipality of Mabini.</span>
          </li>
        </ul>
      </section>

      {/* Footer Navigation */}
      <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "space-between", flexWrap: "wrap" }}>
        <Link href="/support/privacy" className="button secondary sm">
          ← Privacy Policy
        </Link>
        <Link href="/dashboard" className="button green sm">
          Proceed to Resident Portal →
        </Link>
      </div>
    </div>
  );
}
