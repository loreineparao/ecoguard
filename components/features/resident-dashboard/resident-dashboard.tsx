import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/ui/logout-button";

type ResidentRequest = {
  id: string;
  title: string;
  status: string;
  href: string;
  createdAt: string | null;
  kind: "complaint" | "permit";
};

function displayName(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const fullName = user.user_metadata?.full_name;

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  return user.email?.split("@")[0] || "Resident";
}

function shortId(id: string) {
  return id.length > 8 ? id.slice(0, 8).toUpperCase() : id.toUpperCase();
}

function statusClasses(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("approved") || normalizedStatus === "resolved") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (normalizedStatus.includes("review") || normalizedStatus === "pending") {
    return "bg-amber-100 text-amber-800";
  }

  if (normalizedStatus.includes("reject")) {
    return "bg-rose-100 text-rose-800";
  }

  return "bg-sky-100 text-sky-800";
}

function formatDate(date: string | null) {
  if (!date) return "Date unavailable";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export default async function ResidentDashboard() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!hasSupabaseConfig) {
    return (
      <DashboardLayout>
        <DashboardHeader name="Resident" signedIn={false} />
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h2 className="text-lg font-bold">Connect EcoGuard to Supabase</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6">
            Add your Supabase project URL and publishable key to{" "}
            <code className="rounded bg-white/80 px-1.5 py-0.5">.env.local</code>{" "}
            to enable sign-in, registration, and live dashboard data.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-lg bg-[#0d684b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#09573e]">
              Log in
            </Link>
            <Link href="/register" className="rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-100">
              Create an account
            </Link>
          </div>
        </section>
        <ServiceCards />
      </DashboardLayout>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return (
      <DashboardLayout>
        <DashboardHeader name="Resident" signedIn={false} />
        <ErrorMessage message={`Unable to verify your session: ${authError.message}`} />
        <AuthLinks />
        <ServiceCards />
      </DashboardLayout>
    );
  }

  if (!user) {
    redirect("/login?next=%2Fdashboard");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return (
      <DashboardLayout>
        <DashboardHeader name={displayName(user)} signedIn />
        <ErrorMessage message={`Unable to load your account role: ${profileError.message}`} />
        <ServiceCards />
      </DashboardLayout>
    );
  }

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const [complaintResult, permitResult, scheduleResult] = await Promise.all([
    supabase
      .from("complaints")
      .select("id, category, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("permit_applications")
      .select("id, applicant_name, application_status, submitted_at")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(5),
    supabase
      .from("collection_schedules")
      .select("id, barangay, collection_time")
      .order("collection_time", { ascending: true })
      .limit(4),
  ]);

  const requests: ResidentRequest[] = [
    ...(complaintResult.data ?? []).map((complaint) => ({
      id: complaint.id,
      title: complaint.category || "Environmental complaint",
      status: complaint.status || "Pending",
      href: "/complaints",
      createdAt: complaint.created_at,
      kind: "complaint" as const,
    })),
    ...(permitResult.data ?? []).map((permit) => ({
      id: permit.id,
      title: permit.applicant_name
        ? `Tree cutting permit · ${permit.applicant_name}`
        : "Tree cutting permit",
      status: permit.application_status || "Pending",
      href: "/permits",
      createdAt: permit.submitted_at,
      kind: "permit" as const,
    })),
  ]
    .sort((first, second) => {
      return (
        new Date(second.createdAt ?? 0).getTime() -
        new Date(first.createdAt ?? 0).getTime()
      );
    })
    .slice(0, 5);

  const dataErrors = [
    complaintResult.error && `Complaints: ${complaintResult.error.message}`,
    permitResult.error && `Permits: ${permitResult.error.message}`,
    scheduleResult.error && `Collection schedules: ${scheduleResult.error.message}`,
  ].filter((error): error is string => Boolean(error));

  return (
    <DashboardLayout>
      <DashboardHeader name={displayName(user)} signedIn />

      <section className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#428162]">
          Resident dashboard
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#173e30]">
          Welcome back, {displayName(user)}
        </h1>
        <p className="mt-1 text-sm text-[#718178]">
          Start a new request or follow the progress of your existing ones.
        </p>
      </section>

      {dataErrors.length > 0 && (
        <ErrorMessage message={`Some dashboard information could not be loaded. ${dataErrors.join(" · ")}`} />
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
        <div className="space-y-5">
          <ServiceCards />

          <section className="rounded-2xl border border-[#e4ebe6] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#193f31]">My requests</h2>
                <p className="mt-0.5 text-xs text-[#829188]">Your latest submissions and updates</p>
              </div>
              <div className="flex gap-3 text-xs font-semibold">
                <Link href="/complaints" prefetch={false} className="text-[#16714e] hover:underline">Complaints</Link>
                <Link href="/permits" prefetch={false} className="text-[#16714e] hover:underline">Permits</Link>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d8e4dc] bg-[#f8fbf9] px-4 py-7 text-center">
                <p className="text-sm font-semibold text-[#385b49]">No requests yet</p>
                <p className="mt-1 text-xs text-[#819087]">Choose a service above to create your first request.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#edf1ee]">
                {requests.map((request) => (
                  <Link
                    key={`${request.kind}-${request.id}`}
                    href={request.href}
                    prefetch={false}
                    className="flex items-center gap-3 py-3 first:pt-1 last:pb-1"
                  >
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${request.kind === "permit" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`} aria-hidden="true">
                      {request.kind === "permit" ? "T" : "!"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#294638]">{request.title}</span>
                      <span className="mt-0.5 block text-xs text-[#88968e]">
                        {request.kind === "permit" ? "Permit" : "Report"} · {shortId(request.id)} · {formatDate(request.createdAt)}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses(request.status)}`}>
                      {request.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl bg-gradient-to-br from-[#0b4b37] to-[#0d7451] p-5 text-white shadow-md">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/65">Need help?</p>
            <h2 className="mt-1 text-xl font-bold">We’re here for you.</h2>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Not sure which service to choose? EcoGuard Assistant can point you in the right direction.
            </p>
            <Link href="/ai-assistant" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-[#12583d] transition hover:bg-[#eef7f0]">
              Chat with EcoGuard AI
            </Link>
          </section>

          <section id="collection" className="scroll-mt-28 rounded-2xl border border-[#e4ebe6] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#193f31]">Collection schedule</h2>
                <p className="mt-0.5 text-xs text-[#829188]">Published local collection times</p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-lg bg-[#eef6f0] text-xs font-bold text-[#22764f]" aria-hidden="true">CS</span>
            </div>
            {scheduleResult.error ? (
              <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                Schedule unavailable: {scheduleResult.error.message}
              </p>
            ) : scheduleResult.data?.length ? (
              <div className="divide-y divide-[#edf1ee]">
                {scheduleResult.data.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#31513f]">{schedule.barangay}</p>
                      <p className="mt-0.5 text-xs text-[#85938a]">Collection time</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#eaf5ee] px-3 py-1 text-xs font-semibold text-[#26724c]">
                      {schedule.collection_time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-[#f7faf8] p-3 text-xs leading-5 text-[#78887e]">
                There are no collection schedules published yet.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[#e4ebe6] bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#193f31]">Latest update</h2>
            {requests[0] ? (
              <Link href={requests[0].href} prefetch={false} className="mt-3 flex gap-3 rounded-xl bg-[#f7faf8] p-3 transition hover:bg-[#eff6f1]">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e5f1e8] text-sm text-[#26724c]" aria-hidden="true">✓</span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-[#395b48]">{shortId(requests[0].id)} · {requests[0].status}</span>
                  <span className="mt-1 block truncate text-xs text-[#7b8a81]">{requests[0].title}</span>
                </span>
              </Link>
            ) : (
              <p className="mt-3 rounded-xl bg-[#f7faf8] p-3 text-xs leading-5 text-[#78887e]">
                Updates for your requests will appear here.
              </p>
            )}
          </section>
        </aside>
      </div>

      <footer className="mt-8 flex flex-col gap-3 border-t border-[#e8eeea] pt-5 text-xs text-[#87958c] sm:flex-row sm:items-center sm:justify-between">
        <span>EcoGuard · Environmental services for everyone</span>
        <div className="flex gap-4">
          <Link href="/complaints" prefetch={false} className="hover:text-[#176b4b]">My complaints</Link>
          <Link href="/permits" prefetch={false} className="hover:text-[#176b4b]">My permits</Link>
          <LogoutButton />
        </div>
      </footer>
    </DashboardLayout>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#edf3f0] px-3 py-5 text-[#183a30] sm:px-5">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[24px] bg-[#f9fbfa] shadow-[0_20px_70px_-30px_rgba(8,45,30,0.3)] ring-1 ring-white">
        <div className="bg-[#0b4938] px-5 py-2 text-xs font-medium text-white/85">
          EcoGuard · Resident services
        </div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </main>
  );
}

function DashboardHeader({ name, signedIn }: { name: string; signedIn: boolean }) {
  const homeHref = signedIn ? "/dashboard" : "/";

  return (
    <header className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-[#e5ece7] pb-4">
      <Link href={homeHref} className="flex items-center gap-2.5" aria-label="EcoGuard home">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#0d684b] font-bold text-white">E</span>
        <span>
          <span className="block text-base font-extrabold leading-tight text-[#173e30]">EcoGuard</span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-[#829389]">Environmental Services</span>
        </span>
      </Link>
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[#53675e]" aria-label="Dashboard navigation">
        <Link href={homeHref} className="hover:text-[#0c684b]">Home</Link>
        <Link href="/#services" className="hover:text-[#0c684b]">Services</Link>
        <Link href="/#how-it-works" className="hover:text-[#0c684b]">How it works</Link>
        <Link href="/dashboard#collection" className="hover:text-[#0c684b]">Collection schedule</Link>
        <Link href="/complaints" prefetch={false} className="hover:text-[#0c684b]">My complaints</Link>
        <Link href="/permits" prefetch={false} className="hover:text-[#0c684b]">My permits</Link>
      </nav>
      {signedIn ? (
        <span className="rounded-full bg-[#edf6f0] px-3 py-2 text-xs font-semibold text-[#246847]">{name}</span>
      ) : (
        <AuthLinks />
      )}
    </header>
  );
}

function AuthLinks() {
  return (
    <div className="flex gap-2">
      <Link href="/login" className="rounded-lg border border-[#d6e3da] bg-white px-3 py-2 text-xs font-semibold text-[#15553e] hover:bg-[#f3f8f4]">Log in</Link>
      <Link href="/register" className="rounded-lg bg-[#0c684b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#09573e]">Sign up</Link>
    </div>
  );
}

function ServiceCards() {
  const services = [
    {
      title: "Report Illegal Dumping",
      description: "Report a problem and help keep public spaces clean.",
      href: "/complaints/new",
      icon: "!",
      color: "bg-rose-50 text-rose-700",
      action: "Report now",
    },
    {
      title: "Tree Cutting Permit",
      description: "Submit an application and supporting documents.",
      href: "/permits/new",
      icon: "T",
      color: "bg-emerald-50 text-emerald-700",
      action: "Apply for a permit",
    },
    {
      title: "Collection Service",
      description: "Check local waste collection times and details.",
      href: "/dashboard#collection",
      icon: "C",
      color: "bg-sky-50 text-sky-700",
      action: "View schedule",
    },
  ];

  return (
    <section id="services" className="scroll-mt-28 rounded-2xl border border-[#e4ebe6] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-bold text-[#193f31]">Start a new request</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {services.map((service) => (
          <article key={service.title} className="flex flex-col rounded-xl border border-[#e7ede8] bg-[#fcfdfc] p-4">
            <span className={`flex size-9 items-center justify-center rounded-lg text-lg font-bold ${service.color}`} aria-hidden="true">{service.icon}</span>
            <h3 className="mt-3 text-sm font-bold text-[#244737]">{service.title}</h3>
            <p className="mt-1 min-h-10 text-xs leading-5 text-[#7b8b81]">{service.description}</p>
            <Link href={service.href} className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg bg-[#0d684b] px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-[#09573e]">{service.action}</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
      {message}
    </p>
  );
}
