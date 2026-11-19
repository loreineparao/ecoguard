import Link from "next/link";

export default function LandingHeader() {
  return (
    <header className="landing-header-wrap w-full">
      <nav
        className="landing-nav mx-auto flex w-full max-w-7xl flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 lg:max-w-none lg:px-10 xl:px-12 border-0 border-b-0 shadow-none bg-transparent"
        aria-label="Public navigation"
      >
        {/* Branding: Hidden on mobile & tablet (<1024px), visible on desktop (>=1024px) */}
        <div className="landing-brand-wrapper hidden lg:flex min-w-0 items-center justify-start">
          <Link
            className="landing-brand-clean flex min-w-0 shrink-0 items-center gap-2 no-underline transition-opacity hover:opacity-90 sm:gap-2.5"
            href="/"
            aria-label="EcoGuard Home - Mabini, Batangas"
          >
            <span className="landing-brand-title shrink-0 text-xs font-extrabold uppercase tracking-wider text-white min-[390px]:text-[13px] sm:text-sm lg:text-[15px]">
              ECOGUARD
            </span>

            <span
              aria-hidden="true"
              className="landing-brand-separator h-3.5 w-px shrink-0 bg-white/40 sm:h-4"
            />

            <span className="landing-brand-sub shrink-0 text-xs font-semibold uppercase tracking-wider text-emerald-100 min-[390px]:text-[13px] sm:text-sm lg:text-[15px] whitespace-nowrap">
              Mabini, Batangas
            </span>
          </Link>
        </div>

        {/* Authentication Controls: Sign in text link & Create Account button */}
        <div className="landing-nav-actions ml-auto flex items-center justify-end gap-3 sm:gap-3.5 lg:gap-4 translate-y-2">
          <Link
            className="landing-nav-link whitespace-nowrap text-sm font-semibold text-slate-200 transition-colors hover:text-emerald-400 lg:text-[15px]"
            href="/login"
          >
            Sign in
          </Link>

          <Link
            className="landing-login-btn inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-emerald-600 h-10 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 hover:shadow active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 lg:h-[42px] lg:px-5 lg:text-[15px]"
            href="/register"
          >
            Create Account
          </Link>
        </div>
      </nav>
    </header>
  );
}
