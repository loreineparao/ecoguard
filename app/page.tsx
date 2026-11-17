import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Public navigation">
        <Link className="landing-brand" href="/">
          <span className="brand-mark">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <span>
            <strong>EcoGuard</strong>
            <small>Mabini, Batangas</small>
          </span>
        </Link>
        <div className="landing-nav-actions">
          <Link className="landing-login" href="/login">
            Sign in
          </Link>
          <Link className="button green" href="/login">
            Resident Portal <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="eyebrow">
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
            <Link href="/login" className="button secondary">
              Report an Issue
            </Link>
          </div>
        </div>

        <div className="landing-seal-container">
          <Image
            src="/images/mabini-logo.png"
            alt="Official Seal of the Municipality of Mabini, Batangas"
            width={510}
            height={510}
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
