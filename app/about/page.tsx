import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ShieldCheck,
  TreePine,
  MessageSquare,
  Truck,
  Bot,
  MapPin,
  Clock,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "About EcoGuard | MENR Office Mabini, Batangas",
  description:
    "Learn about EcoGuard: An AI-Enabled Environmental Complaint and Service Management System developed for the MENR Office in Mabini, Batangas.",
};

export default async function AboutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dashboardUrl = "/dashboard";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      dashboardUrl = "/admin";
    }
  }

  return (
    <div className="about-public-page">
      {/* Top Navigation */}
      <header className="about-public-nav" aria-label="About page navigation">
        <div className="about-nav-container">
          <Link href={dashboardUrl} className="landing-brand-clean" aria-label="EcoGuard Home">
            <span className="landing-brand-title">EcoGuard</span>
            <span className="landing-brand-sub">MABINI, BATANGAS</span>
          </Link>
          <div className="about-nav-actions">
            <Link href={dashboardUrl} className="about-nav-link" aria-label="Back to Dashboard">
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="about-main-container">
        {/* Hero Section */}
        <section className="about-hero-section">
          <div className="about-hero-badge">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>MENR Office • Municipality of Mabini, Batangas</span>
          </div>
          <h1 className="about-hero-title">About EcoGuard</h1>
          <p className="about-hero-desc">
            An AI-Enabled Web-Based Environmental Complaint and Service Management System developed for the
            Municipal Environment and Natural Resources Office (MENR) of Mabini, Batangas.
          </p>
        </section>

        {/* LGU & System Mission Section */}
        <section className="card about-mission-card">
          <div className="about-seal-grid">
            <div className="about-seal-col">
              <Image
                src="/images/mabini-logo.png"
                alt="Official Seal of the Municipality of Mabini, Batangas"
                width={170}
                height={170}
                priority
                className="about-seal-img"
              />
              <span className="about-seal-caption">
                Bayan ng Mabini, Batangas
              </span>
            </div>

            <div className="about-intro-col">
              <span className="eyebrow">ENVIRONMENTAL GOVERNANCE &amp; COMMUNITY ACTION</span>
              <h2>Preserving Mabini’s Ecological Wealth</h2>
              <p>
                The Municipality of Mabini, Batangas is renowned across the Philippines and the world for its rich coastal ecosystems, coral reefs, and marine biodiversity. Sustaining this natural heritage requires proactive citizen collaboration, transparent municipal tracking, and rapid environmental enforcement.
              </p>
              <p>
                <strong>EcoGuard</strong> bridges the communication gap between Mabini residents and the <strong>Municipal Environment and Natural Resources Office (MENR)</strong>. By digitizing solid waste complaint reporting, tree cutting permit applications, and collection schedule tracking, EcoGuard helps protect both coastal waters and inland communities.
              </p>
            </div>
          </div>

          {/* Academic Capstone Notice */}
          <div className="about-academic-notice">
            <strong className="text-forest">Capstone Research Initiative: </strong>
            EcoGuard was developed as an undergraduate capstone research project for <strong>Batangas State University</strong> in cooperation with the MENR Office of Mabini, Batangas. It showcases the integration of Next.js 16, Supabase PostgreSQL, and Google Gemini AI assistance in local government service delivery.
          </div>
        </section>

        {/* Core Capabilities Grid */}
        <section className="about-modules-section">
          <div className="section-heading">
            <span className="eyebrow">MUNICIPAL SERVICES</span>
            <h2>Core System Capabilities</h2>
            <p className="section-subtitle">
              Designed to make environmental governance accessible, efficient, and transparent for every Mabini resident.
            </p>
          </div>

          <div className="about-modules-grid">
            {/* Capability 1: Complaints (Illegal Dumping Only) */}
            <div className="card about-module-card">
              <div className="about-module-icon green">
                <MessageSquare size={22} aria-hidden="true" />
              </div>
              <h3>Environmental Complaint Reporting</h3>
              <p>
                Allows residents to report illegal dumping incidents with photographic evidence and geotagged incident locations. Residents can track complaint investigation status as MENR field officers verify and address the violation.
              </p>
              <div className="about-module-tag">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>Photo Evidence &amp; Status Tracking</span>
              </div>
            </div>

            {/* Capability 2: Tree Cutting Permits */}
            <div className="card about-module-card">
              <div className="about-module-icon emerald">
                <TreePine size={22} aria-hidden="true" />
              </div>
              <h3>Tree-Cutting Permit Applications</h3>
              <p>
                Enables residents to submit tree-cutting permit applications and upload required supporting documents (such as land titles and barangay clearances) for formal administrative review and scheduling of physical site inspection by MENR personnel.
              </p>
              <div className="about-module-tag">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>Document Submission &amp; MENR Review</span>
              </div>
            </div>

            {/* Capability 3: Garbage Collection Schedules */}
            <div className="card about-module-card">
              <div className="about-module-icon teal">
                <Truck size={22} aria-hidden="true" />
              </div>
              <h3>Garbage Collection Schedules</h3>
              <p>
                Allows residents to view official solid waste collection days, routes, and designated pickup windows published and updated by the MENR Office across all 34 Mabini barangays.
              </p>
              <div className="about-module-tag">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>Published MENR Schedules</span>
              </div>
            </div>

            {/* Capability 4: Gemini AI Assistant */}
            <div className="card about-module-card">
              <div className="about-module-icon forest">
                <Bot size={22} aria-hidden="true" />
              </div>
              <h3>Google Gemini AI Assistant</h3>
              <p>
                An AI-powered service guidance tool that helps residents understand municipal environmental guidelines, clarify required permit documents, and navigate directly to the appropriate complaint or application forms.
              </p>
              <div className="about-module-tag">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>Bilingual Service Guidance</span>
              </div>
            </div>
          </div>
        </section>

        {/* MENR Office Contact & Hours (3 Equally Spaced Columns) */}
        <section className="card about-office-card">
          <div className="section-heading-compact">
            <span className="eyebrow">OFFICE DIRECTORY</span>
            <h2>Municipal Environment &amp; Natural Resources Office</h2>
          </div>

          <div className="about-contact-grid">
            {/* Column 1: Office Location */}
            <div className="about-contact-item">
              <div className="about-contact-icon">
                <Building2 size={20} aria-hidden="true" />
              </div>
              <div>
                <strong>Office Location</strong>
                <p>Municipal Hall Complex, F. Castillo Blvd., Poblacion, Mabini, Batangas 4202</p>
              </div>
            </div>

            {/* Column 2: Operating Hours */}
            <div className="about-contact-item">
              <div className="about-contact-icon">
                <Clock size={20} aria-hidden="true" />
              </div>
              <div>
                <strong>Operating Hours</strong>
                <p>
                  Monday–Thursday<br />
                  8:00 AM – 6:00 PM
                </p>
              </div>
            </div>

            {/* Column 3: Jurisdiction */}
            <div className="about-contact-item">
              <div className="about-contact-icon">
                <MapPin size={20} aria-hidden="true" />
              </div>
              <div>
                <strong>Jurisdiction</strong>
                <p>Municipality of Mabini, Province of Batangas (All 34 Barangays)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Environmental Awareness Section */}
        <section className="about-cta-card">
          <div className="about-cta-content">
            <h2>Ready to help protect our municipality?</h2>
            <p>
              Community vigilance and active resident cooperation are essential to preserving Mabini&apos;s marine sanctuaries and ecological wealth. By reporting illegal dumping, adhering to published waste collection schedules, and complying with environmental regulations, every resident contributes to a cleaner, greener municipality.
            </p>
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <footer className="about-public-footer">
        <div className="about-footer-container">
          <p>
            EcoGuard · Environmental Management System · MENR Office, Municipality of Mabini, Batangas
          </p>
          <div className="about-footer-links">
            <Link href={dashboardUrl}>Dashboard</Link>
            <span>•</span>
            <Link href="/about">About</Link>
            <span>•</span>
            <Link href="/support/faq">FAQs</Link>
            <span>•</span>
            <Link href="/support/privacy">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
