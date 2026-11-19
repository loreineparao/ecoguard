import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import LandingHeader from "@/components/landing-header";

export default function Home() {
  return (
    <main className="landing-page">
      {/* Background layer with Mabini Municipal Hall fading into EcoGuard dark green */}
      <div className="landing-backdrop" aria-hidden="true">
        <div className="landing-backdrop-image" />
        <div className="landing-backdrop-gradient" />
      </div>

      <LandingHeader />

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="eyebrow landing-eyebrow">
            <MapPin size={13} aria-hidden="true" /> MENR SERVICES • MUNICIPALITY OF MABINI
          </p>
          <h1>
            Better communities start with <span>better action.</span>
          </h1>
          <p className="landing-copy">
            EcoGuard connects residents with the MENR Office to seamlessly report concerns, issue permits, and track community requests in real time.
          </p>
          <div className="landing-actions">
            <Link href="/login" className="button green">
              Open Resident Portal <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/login" className="button secondary landing-report-btn">
              Report an Issue
            </Link>
          </div>
        </div>

        <div className="landing-seal-container">
          <Image
            src="/images/mabini-logo.png"
            alt="Official Seal of the Municipality of Mabini, Batangas"
            width={380}
            height={380}
            priority
            className="landing-seal-image"
          />
        </div>
      </section>

      <footer className="landing-footer">
        EcoGuard · Environmental Management System · MENR Office, Municipality of Mabini, Batangas
      </footer>
    </main>
  );
}
