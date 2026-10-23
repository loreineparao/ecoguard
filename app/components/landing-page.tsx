"use client";

import Link from "next/link";
import { useState } from "react";
import { trackComplaint } from "@/app/actions/track-complaint";

type IconName = "leaf" | "menu" | "arrow" | "search" | "trash" | "tree" | "truck" | "check" | "pin" | "clock" | "shield";

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    leaf: <><path d="M20 4c-8 0-14 4-14 11a5 5 0 0 0 5 5c7 0 11-6 9-16Z" /><path d="M4 21c2-5 6-8 11-11" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
    tree: <><path d="M12 22v-8m-6-1 6-9 6 9h-4l4 5H6l4-5H6Z" /></>,
    truck: <><path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" /><circle cx="7.5" cy="19" r="1.5" /><circle cx="17.5" cy="19" r="1.5" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  };

  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

const services = [
  {
    title: "Illegal Dumping Report",
    description: "Help us respond to illegal dumping and protect public spaces.",
    action: "Report an issue",
    href: "/complaints/new",
    icon: "trash" as const,
    tone: "rose",
  },
  {
    title: "Tree Cutting Permit",
    description: "Apply for a permit and check your application progress.",
    action: "Apply for a permit",
    href: "/permits/new",
    icon: "tree" as const,
    tone: "green",
  },
  {
    title: "Collection Schedule",
    description: "Stay up to date with waste collection in your area.",
    action: "View collection info",
    href: "/dashboard",
    icon: "truck" as const,
    tone: "blue",
  },
];

export default function LandingPage({
  dashboardHref,
}: {
  dashboardHref: "/dashboard" | "/admin" | null;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportId, setReportId] = useState("");
  const [trackMessage, setTrackMessage] = useState("");
  const [trackError, setTrackError] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackStatus, setTrackStatus] = useState("");
  const [signInRequired, setSignInRequired] = useState(false);

  async function handleTrackReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTrackMessage("");
    setTrackStatus("");
    setTrackError(false);
    setSignInRequired(false);
    setTrackLoading(true);

    try {
      const result = await trackComplaint(reportId);
      if (result.success) {
        setTrackStatus(result.status ?? "Pending");
      } else {
        setTrackMessage(result.error);
        setTrackError(true);
        setSignInRequired("signInRequired" in result && result.signInRequired === true);
      }
    } catch {
      setTrackMessage("We couldn't check your report right now. Please try again.");
      setTrackError(true);
    } finally {
      setTrackLoading(false);
    }
  }

  const statusSteps = ["Pending", "Under Review", "Dispatched", "Resolved"];
  const activeStep = statusSteps.indexOf(trackStatus);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8fbf9] text-[#183a30]">
      <div className="bg-[#0b4938] px-4 py-2 text-center text-xs font-medium tracking-wide text-white/90">
        A cleaner, greener community starts with you.
      </div>

      <header className="sticky top-0 z-30 border-b border-[#e6eee9] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="EcoGuard home">
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#0d684b] text-white shadow-sm">
              <Icon name="leaf" className="size-6" />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight text-[#123e30]">EcoGuard</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7b9287]">Environmental Services</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#53675e] md:flex" aria-label="Main navigation">
            <a className="text-[#086747]" href="#home">Home</a>
            <a className="transition hover:text-[#086747]" href="#services">Services</a>
            <a className="transition hover:text-[#086747]" href="#how-it-works">How it works</a>
            <a className="transition hover:text-[#086747]" href="#collection">Collection schedule</a>
            <a className="transition hover:text-[#086747]" href="#track-report">Track a report</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {dashboardHref ? (
              <Link href={dashboardHref} className="rounded-lg bg-[#0c684b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#09573e]">
                My dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#15553e] transition hover:bg-[#f0f7f3]">Log in</Link>
                <Link href="/register" className="rounded-lg bg-[#0c684b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#09573e]">Create account</Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-lg border border-[#e0e9e3] text-[#174d39] md:hidden"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <Icon name="menu" />
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="grid gap-1 border-t border-[#e6eee9] bg-white px-5 py-3 md:hidden" aria-label="Mobile navigation">
            {[["Home", "#home"], ["Services", "#services"], ["How it works", "#how-it-works"], ["Collection schedule", "#collection"], ["Track a report", "#track-report"]].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#344f43] hover:bg-[#f1f7f3]">{label}</a>
            ))}
            <div className="mt-2 flex gap-2 border-t border-[#edf2ee] pt-3">
              {dashboardHref ? (
                <Link href={dashboardHref} className="flex-1 rounded-lg bg-[#0c684b] px-3 py-2.5 text-center text-sm font-semibold text-white">My dashboard</Link>
              ) : (
                <>
                  <Link href="/login" className="flex-1 rounded-lg border border-[#dbe7df] px-3 py-2.5 text-center text-sm font-semibold text-[#15553e]">Log in</Link>
                  <Link href="/register" className="flex-1 rounded-lg bg-[#0c684b] px-3 py-2.5 text-center text-sm font-semibold text-white">Create account</Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <section id="home" className="relative">
        <div className="pointer-events-none absolute -right-40 -top-40 size-[500px] rounded-full bg-[#e7f2e9] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cfe5d6] bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#18704e] shadow-sm">
              <span className="size-2 rounded-full bg-[#30a46c]" />
              Your community, a little greener
            </div>
            <h1 className="max-w-2xl text-[clamp(2.65rem,6vw,4.65rem)] leading-[1.03] font-bold tracking-[-0.055em] text-[#133e30]">
              Environmental services for <span className="text-[#0b7853]">Mabini,</span> made simple.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#63766c] sm:text-lg sm:leading-8">
              Report illegal dumping, apply for a tree cutting permit, or check your collection schedule — all in one easy place.
            </p>
            <div className="mt-8">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#779084]">What would you like to do?</p>
              <div className="flex flex-wrap gap-2.5">
                <Link href="/complaints/new" className="inline-flex items-center gap-2 rounded-lg bg-[#0c684b] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#09573e]">
                  <Icon name="trash" className="size-4" /> Report illegal dumping
                </Link>
                <Link href="/permits/new" className="inline-flex items-center gap-2 rounded-lg border border-[#d7e4da] bg-white px-4 py-3 text-sm font-semibold text-[#235842] transition hover:-translate-y-0.5 hover:border-[#91b9a0] hover:bg-[#f5faf6]">
                  <Icon name="tree" className="size-4" /> Tree cutting permit
                </Link>
                <a href="#collection" className="inline-flex items-center gap-2 rounded-lg border border-[#d7e4da] bg-white px-4 py-3 text-sm font-semibold text-[#235842] transition hover:-translate-y-0.5 hover:border-[#91b9a0] hover:bg-[#f5faf6]">
                  <Icon name="truck" className="size-4" /> Collection schedule
                </a>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[#71857b]">
              <span className="inline-flex items-center gap-1.5"><Icon name="shield" className="size-4 text-[#0c8058]" /> A trusted local service</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="clock" className="size-4 text-[#0c8058]" /> Simple, step-by-step process</span>
            </div>
          </div>

          <div id="track-report" className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#e4f0e7] to-transparent" />
            <div className="relative rounded-2xl border border-[#e4ece6] bg-white p-6 shadow-[0_24px_70px_-30px_rgba(22,80,54,0.28)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#edf7f0] text-[#0b7450]"><Icon name="search" /></span>
                  <h2 className="text-xl font-bold tracking-tight text-[#173f30]">Track your report</h2>
                  <p className="mt-1 text-sm leading-6 text-[#74857c]">See the latest update on an issue you reported.</p>
                </div>
                <span className="rounded-full bg-[#f0f7f2] px-3 py-1 text-[11px] font-semibold text-[#3d7758]">Live updates</span>
              </div>

              <form onSubmit={handleTrackReport} className="mt-6">
                <label htmlFor="report-id" className="mb-2 block text-xs font-semibold text-[#41594c]">Your report ID</label>
                <div className="flex gap-2">
                  <input
                    id="report-id"
                    value={reportId}
                    onChange={(event) => setReportId(event.target.value)}
                    placeholder="e.g. paste your report ID"
                    required
                    className="h-12 min-w-0 flex-1 rounded-lg border border-[#dce6df] bg-[#fcfdfc] px-3.5 text-sm text-[#243e32] outline-none transition placeholder:text-[#a1aea6] focus:border-[#26865e] focus:ring-4 focus:ring-[#e5f4e9]"
                  />
                  <button type="submit" disabled={trackLoading} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0c684b] px-4 text-sm font-semibold text-white transition hover:bg-[#09573e] disabled:cursor-wait disabled:opacity-60">
                    {trackLoading ? "Checking..." : "Track"} <Icon name="arrow" className="size-4" />
                  </button>
                </div>
              </form>

              {trackMessage && (
                <div role="status" className={`mt-4 rounded-lg border px-3.5 py-3 text-sm ${trackError ? "border-amber-200 bg-amber-50 text-amber-900" : "border-[#dcebe0] bg-[#f4faf5] text-[#255c3c]"}`}>
                  <p>{trackMessage}</p>
                  {signInRequired && <Link href="/login" className="mt-2 inline-flex font-semibold underline underline-offset-2">Log in to your account</Link>}
                </div>
              )}

              <div className="mt-7 border-t border-[#edf1ee] pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#53695d]">{trackStatus ? "Current report progress" : "How it works"}</p>
                  {trackStatus && <span className="rounded-full bg-[#e9f5ed] px-2.5 py-1 text-[11px] font-bold text-[#1b7049]">{trackStatus}</span>}
                </div>
                <div className="grid grid-cols-4">
                  {statusSteps.map((step, index) => {
                    const complete = activeStep >= 0 && index <= activeStep;
                    return (
                      <div className="relative flex flex-col items-center text-center" key={step}>
                        {index < statusSteps.length - 1 && <span className={`absolute left-1/2 top-3 h-px w-full ${complete && activeStep > index ? "bg-[#64ae7d]" : "bg-[#e2eae4]"}`} />}
                        <span className={`relative z-10 flex size-6 items-center justify-center rounded-full border ${complete ? "border-[#18744e] bg-[#18744e] text-white" : "border-[#dbe5dd] bg-white text-[#92a197]"}`}>
                          {complete ? <Icon name="check" className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}
                        </span>
                        <span className={`mt-2 text-[10px] leading-4 sm:text-[11px] ${complete ? "font-semibold text-[#1e6545]" : "text-[#91a097]"}`}>{step}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-center text-[11px] text-[#8a9990]">Your report details are only visible to you when you sign in.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#36815e]">Here to help</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#173e30] sm:text-4xl">Our services</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#718178]">Choose a service to get started. We’ll guide you through each step.</p>
            </div>
            <a href="#how-it-works" className="hidden items-center gap-2 text-sm font-semibold text-[#14724e] sm:inline-flex">How it works <Icon name="arrow" className="size-4" /></a>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {services.map((service) => (
              <article key={service.title} id={service.title === "Collection Schedule" ? "collection" : undefined} className="group flex flex-col rounded-2xl border border-[#e4ebe6] bg-white p-5 shadow-[0_6px_24px_-20px_rgba(20,65,43,0.3)] transition hover:-translate-y-1 hover:border-[#bdd5c4] hover:shadow-[0_20px_40px_-25px_rgba(20,65,43,0.28)] sm:p-6">
                <span className={`mb-5 flex size-11 items-center justify-center rounded-xl ${service.tone === "rose" ? "bg-[#fff0ed] text-[#c26456]" : service.tone === "green" ? "bg-[#eaf6ef] text-[#2e8b61]" : "bg-[#edf3fb] text-[#557ca8]"}`}>
                  <Icon name={service.icon} />
                </span>
                <h3 className="text-lg font-bold text-[#183e30]">{service.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[#74847b]">{service.description}</p>
                <Link href={service.href} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0d684b] px-4 text-sm font-semibold text-white transition group-hover:bg-[#09573e]">
                  {service.action}<Icon name="arrow" className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#f4f8f5] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#36815e]">Getting started</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#173e30] sm:text-4xl">How it works</h2>
            <p className="mt-2 text-sm leading-6 text-[#718178]">A straightforward way to connect with your environmental services team.</p>
          </div>
          <div className="mt-9 grid gap-7 md:grid-cols-3">
            {[
              ["01", "Tell us what you need", "Choose a service and let us know how we can help.", "pin"],
              ["02", "Fill in the details", "Add the information needed to process your request.", "check"],
              ["03", "Follow the progress", "Sign in anytime to check updates on your report.", "clock"],
            ].map(([number, title, description, icon]) => (
              <div key={number} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#0c684b] text-xs font-bold text-white shadow-sm">{number}</span>
                <div>
                  <h3 className="font-bold text-[#224838]">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#73837a]">{description}</p>
                </div>
                <Icon name={icon as IconName} className="ml-auto hidden size-5 shrink-0 text-[#76a58a] lg:block" />
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-5 rounded-2xl bg-gradient-to-r from-[#0b4a37] to-[#0d7451] p-6 text-white shadow-lg sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15"><Icon name="leaf" /></span>
              <div>
                <h3 className="text-lg font-bold">Not sure where to start?</h3>
                <p className="mt-1 max-w-lg text-sm leading-6 text-white/75">Create an account to manage your requests and get updates from your environmental services team.</p>
              </div>
            </div>
            <Link href={dashboardHref ?? "/register"} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-[#13563c] transition hover:bg-[#edf6ef]">
              {dashboardHref ? "Go to your dashboard" : "Create your account"} <Icon name="arrow" className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#092e24] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-[#8fd0a5]"><Icon name="leaf" /></span>
              <span className="text-lg font-bold tracking-tight">EcoGuard</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/60">Environmental services made easier for a cleaner, healthier community.</p>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/90">Services</h2>
            <div className="mt-4 grid gap-3 text-sm text-white/60">
              <Link href="/complaints/new" className="transition hover:text-white">Report illegal dumping</Link>
              <Link href="/permits/new" className="transition hover:text-white">Tree cutting permit</Link>
              <a href="#collection" className="transition hover:text-white">Collection schedule</a>
            </div>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/90">Quick links</h2>
            <div className="mt-4 grid gap-3 text-sm text-white/60">
              <Link href={dashboardHref ?? "/login"} className="transition hover:text-white">My account</Link>
              <a href="#track-report" className="transition hover:text-white">Track a report</a>
              <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            </div>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/90">Your community</h2>
            <p className="mt-4 text-sm leading-6 text-white/60">Small actions make a lasting difference. Thanks for helping keep our community green.</p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>© {new Date().getFullYear()} EcoGuard. Environmental services for everyone.</p>
            <a href="#home" className="transition hover:text-white/80">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
