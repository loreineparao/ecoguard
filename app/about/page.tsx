import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  TreePine,
  MessageSquare,
  Truck,
  Bot,
  MapPin,
  Clock,
  Mail,
  Building2,
  CheckCircle2,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

export const metadata = {
  title: "About EcoGuard | MENR Office Mabini, Batangas",
  description:
    "Learn about EcoGuard: An AI-Enabled Environmental Complaint and Service Management System for the MENR Office in Mabini, Batangas.",
};

export default function AboutPage() {
  return (
    <div className="about-public-page">
      {/* Public Top Navigation */}
      <header className="about-public-nav" aria-label="Public navigation">
        <div className="about-nav-container">
          <Link href="/" className="landing-brand-clean" aria-label="EcoGuard Home">
            <span className="landing-brand-title">EcoGuard</span>
            <span className="landing-brand-sub">MABINI, BATANGAS</span>
          </Link>
          <div className="about-nav-actions">
            <Link href="/" className="about-nav-link">
              <ArrowLeft size={15} aria-hidden="true" />
              <span>Home</span>
            </Link>
            <ThemeToggle />
            <Link href="/login" className="button green sm">
              Sign in <ArrowRight size={14} aria-hidden="true" />
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
          <div className="about-hero-actions">
            <Link href="/login" className="button green">
              Open Resident Portal <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/support/faq" className="button secondary">
              Read FAQs &amp; Help
            </Link>
          </div>
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
            {/* Capability 1: Complaints */}
            <div className="card about-module-card">
              <div className="about-module-icon green">
                <MessageSquare size={22} aria-hidden="true" />
              </div>
              <h3>Environmental Complaint Reporting</h3>
              <p>
                Residents can report illegal dumping, open burning, and uncollected waste. Supports photo evidence uploads and GPS location tagging to guide MENR field inspectors directly to the site.
              </p>
              <div className="about-module-tag">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>Geotagged &amp; Timestamped</span>
              </div>
            </div>

            {/* Capability 2: Tree Cutting Permits */}
            <div className="card about-module-card">
              <div className="about-module-icon emerald">
                <TreePine size={22} aria-hidden="true" />
              </div>
              <h3>Tree Cutting Permit Applications</h3>
              <p>
                Complies with Presidential Decree 705 (Revised Forestry Code). Residents submit digital permit requests with required land titles, barangay clearances, and tree species details for MENR review.
              </p>
              <div className="about-module-tag">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>PD 705 Compliant</span>
              </div>
            </div>

            {/* Capability 3: Garbage Collection Schedules */}
            <div className="card about-module-card">
              <div className="about-module-icon teal">
                <Truck size={22} aria-hidden="true" />
              </div>
              <h3>Garbage Collection Schedules</h3>
              <p>
                Real-time schedules and collection route notices for all 34 Mabini barangays. Ensures households and businesses know exact pickup days to avoid roadside waste buildup.
              </p>
              <div className="about-module-tag">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>34 Mabini Barangays</span>
              </div>
            </div>

            {/* Capability 4: Gemini AI Assistant */}
            <div className="card about-module-card">
              <div className="about-module-icon forest">
                <Bot size={22} aria-hidden="true" />
              </div>
              <h3>Google Gemini AI Assistant</h3>
              <p>
                24/7 bilingual chatbot assistant (Tagalog &amp; English) that guides residents on waste segregation rules, permit documentation, collection schedules, and filing procedures.
              </p>
              <div className="about-module-tag">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>Bilingual AI Guidance</span>
              </div>
            </div>
          </div>
        </section>

        {/* MENR Office Contact & Hours */}
        <section className="card about-office-card">
          <div className="section-heading-compact">
            <span className="eyebrow">OFFICE DIRECTORY</span>
            <h2>Municipal Environment &amp; Natural Resources Office</h2>
          </div>

          <div className="about-contact-grid">
            <div className="about-contact-item">
              <div className="about-contact-icon">
                <Building2 size={20} aria-hidden="true" />
              </div>
              <div>
                <strong>Office Location</strong>
                <p>Municipal Hall Complex, F. Castillo Blvd., Poblacion, Mabini, Batangas 4202</p>
              </div>
            </div>

            <div className="about-contact-item">
              <div className="about-contact-icon">
                <Clock size={20} aria-hidden="true" />
              </div>
              <div>
                <strong>Operating Hours</strong>
                <p>Monday to Friday: 8:00 AM – 5:00 PM (Except official holidays)</p>
              </div>
            </div>

            <div className="about-contact-item">
              <div className="about-contact-icon">
                <Mail size={20} aria-hidden="true" />
              </div>
              <div>
                <strong>Official Email</strong>
                <p>menr@mabini.gov.ph</p>
              </div>
            </div>

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

        {/* CTA Banner */}
        <section className="about-cta-card">
          <div className="about-cta-content">
            <h2>Ready to help protect our municipality?</h2>
            <p>
              Register or sign in to your EcoGuard Resident Account to report waste violations, apply for tree cutting permits, or check your barangay collection schedule.
            </p>
            <div className="about-cta-buttons">
              <Link href="/login" className="button green">
                Sign In to Resident Portal <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/login" className="button secondary">
                Create an Account
              </Link>
            </div>
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
            <Link href="/">Home</Link>
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
