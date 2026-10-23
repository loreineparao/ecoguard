import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/ui/logout-button";

type ComplaintTrend = { month: string; count: number };

function monthLabels() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return {
      month: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
    };
  });
}

function getComplaintTrend(rows: { created_at: string }[] | null): ComplaintTrend[] {
  const months = monthLabels();

  return months.map(({ month, year }) => ({
    month,
    count: (rows ?? []).filter((row) => {
      const date = new Date(row.created_at);
      const selectedMonth = months.find((item) => item.month === month && item.year === year);
      return date.getMonth() === selectedMonth?.monthIndex && date.getFullYear() === year;
    }).length,
  }));
}

function trendPoints(values: number[]) {
  const max = Math.max(...values, 1);
  return values
    .map((value, index) => `${24 + index * 54},${98 - (value / max) * 70}`)
    .join(" ");
}

function statusStyle(status: string) {
  const value = status.toLowerCase();
  if (value.includes("resolved") || value.includes("approved")) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (value.includes("review") || value.includes("pending")) {
    return "bg-amber-100 text-amber-800";
  }
  if (value.includes("reject")) {
    return "bg-rose-100 text-rose-800";
  }
  return "bg-sky-100 text-sky-800";
}

function compactId(id: string) {
  return id.length > 8 ? id.slice(0, 8).toUpperCase() : id.toUpperCase();
}

export default async function AdminDashboard() {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!isConfigured) {
    return (
      <AdminShell>
        <AdminHeader name="MENR Admin" email="" />
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h1 className="text-xl font-bold">Connect EcoGuard to Supabase</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6">
            The admin dashboard needs your Supabase project URL, publishable key,
            and application tables. Add the project values to{" "}
            <code className="rounded bg-white/80 px-1.5 py-0.5">.env.local</code>,
            then run the database migrations before signing in.
          </p>
          <Link href="/" className="mt-4 inline-flex rounded-lg bg-[#0c684b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#09573e]">
            Back to EcoGuard home
          </Link>
        </section>
      </AdminShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return (
      <AdminShell>
        <AdminHeader name="MENR Admin" email="" />
        <ErrorNotice message={`Unable to verify your session: ${authError.message}`} />
      </AdminShell>
    );
  }

  if (!user) {
    redirect("/login?next=%2Fadmin");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return (
      <AdminShell>
        <AdminHeader name="MENR Admin" email={user.email ?? ""} />
        <ErrorNotice message={`Unable to load your profile: ${profileError.message}`} />
      </AdminShell>
    );
  }

  if (!profile) {
    return (
      <AdminShell>
        <AdminHeader name="MENR Admin" email={user.email ?? ""} />
        <ErrorNotice message="Your user profile was not found. Ask an administrator to create your EcoGuard profile before accessing admin tools." />
      </AdminShell>
    );
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    complaintCount,
    pendingComplaintCount,
    permitCount,
    pendingPermitCount,
    scheduleCount,
    tripCount,
    complaints,
    permits,
    schedules,
    trendRows,
  ] = await Promise.all([
    supabase.from("complaints").select("id", { count: "exact", head: true }),
    supabase.from("complaints").select("id", { count: "exact", head: true }).in("status", ["Pending", "Under Review"]),
    supabase.from("permit_applications").select("id", { count: "exact", head: true }),
    supabase.from("permit_applications").select("id", { count: "exact", head: true }).eq("application_status", "Pending"),
    supabase.from("collection_schedules").select("id", { count: "exact", head: true }),
    supabase.from("trip_tickets").select("id", { count: "exact", head: true }),
    supabase
      .from("complaints")
      .select("id, category, status, assigned_personnel, created_at")
      .in("status", ["Pending", "Under Review", "Dispatched"])
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("permit_applications")
      .select("id, applicant_name, application_status, submitted_at")
      .order("submitted_at", { ascending: false })
      .limit(4),
    supabase
      .from("collection_schedules")
      .select("id, barangay, collection_time")
      .order("collection_time", { ascending: true })
      .limit(5),
    supabase
      .from("complaints")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString())
      .order("created_at", { ascending: true }),
  ]);

  const queryErrors = [
    complaintCount.error && `Complaint total: ${complaintCount.error.message}`,
    pendingComplaintCount.error && `Complaint alerts: ${pendingComplaintCount.error.message}`,
    permitCount.error && `Permit total: ${permitCount.error.message}`,
    pendingPermitCount.error && `Pending permits: ${pendingPermitCount.error.message}`,
    scheduleCount.error && `Schedule total: ${scheduleCount.error.message}`,
    tripCount.error && `Trip ticket total: ${tripCount.error.message}`,
    complaints.error && `Recent complaints: ${complaints.error.message}`,
    permits.error && `Recent permits: ${permits.error.message}`,
    schedules.error && `Collection schedules: ${schedules.error.message}`,
    trendRows.error && `Complaint trends: ${trendRows.error.message}`,
  ].filter((error): error is string => Boolean(error));

  const trend = getComplaintTrend(trendRows.data);
  const trendValues = trend.map((item) => item.count);
  const maxTrendValue = Math.max(...trendValues, 0);
  const minTrendValue = Math.min(...trendValues, 0);
  const managerName = profile.full_name || "MENR Admin";

  return (
    <AdminShell>
      <AdminHeader name={managerName} email={profile.email ?? user.email ?? ""} />

      <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#428162]">Overview</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#173e30]">Admin dashboard</h1>
          <p className="mt-1 text-sm text-[#718178]">Review cases, permits, and collection operations.</p>
        </div>
        <Link href="/admin/reports" className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0c684b] px-4 text-sm font-semibold text-white hover:bg-[#09573e]">
          Generate report
        </Link>
      </section>

      {queryErrors.length > 0 && (
        <ErrorNotice message={`Some dashboard data could not be loaded. ${queryErrors.join(" · ")}`} />
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Database totals">
        <StatCard label="Complaints" value={complaintCount.error ? null : complaintCount.count} note="All submitted reports" href="/admin/complaints" tone="rose" />
        <StatCard label="Permits" value={permitCount.error ? null : permitCount.count} note={pendingPermitCount.error ? "Pending count unavailable" : `${pendingPermitCount.count ?? 0} pending applications`} href="/admin/permits" tone="amber" />
        <StatCard label="Collection schedules" value={scheduleCount.error ? null : scheduleCount.count} note="Published schedules" href="/admin/collection" tone="green" />
        <StatCard label="Trip tickets" value={tripCount.error ? null : tripCount.count} note={pendingComplaintCount.error ? "Open case count unavailable" : `${pendingComplaintCount.count ?? 0} complaints need attention`} href="/admin/collection/trip-tickets" tone="blue" />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(290px,0.8fr)]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#e4ebe6] bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#193f31]">Complaints that need action</h2>
                <p className="mt-1 text-xs text-[#829188]">Latest resident reports from the database</p>
              </div>
              <Link href="/admin/complaints" prefetch={false} className="text-xs font-semibold text-[#176b49] hover:underline">View all</Link>
            </div>
            {complaints.error ? (
              <InlineError message={complaints.error.message} />
            ) : complaints.data?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[660px] text-left text-xs">
                  <thead className="border-b border-[#e9efeb] text-[10px] uppercase tracking-[0.08em] text-[#89968e]">
                    <tr>
                      <th className="px-2 py-2 font-semibold">Reference</th>
                      <th className="px-2 py-2 font-semibold">Category</th>
                      <th className="px-2 py-2 font-semibold">Assigned personnel</th>
                      <th className="px-2 py-2 font-semibold">Status</th>
                      <th className="px-2 py-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf1ee]">
                    {complaints.data.map((complaint) => (
                      <tr key={complaint.id}>
                        <td className="px-2 py-3 font-semibold text-[#345342]">{compactId(complaint.id)}</td>
                        <td className="max-w-36 truncate px-2 py-3 text-[#5d7065]">{complaint.category}</td>
                        <td className="max-w-36 truncate px-2 py-3 text-[#718178]">{complaint.assigned_personnel || "Unassigned"}</td>
                        <td className="px-2 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyle(complaint.status || "Pending")}`}>{complaint.status || "Pending"}</span></td>
                        <td className="px-2 py-3"><Link href="/admin/complaints" prefetch={false} className="rounded-md border border-[#d4e1d8] px-2.5 py-1.5 font-semibold text-[#276747] hover:bg-[#f2f8f3]">Review</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="No complaints have been submitted yet." />
            )}
          </section>

          <section className="rounded-2xl border border-[#e4ebe6] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#193f31]">Complaint trends</h2>
                <p className="mt-1 text-xs text-[#829188]">Reports submitted over the last six months</p>
              </div>
              <Link href="/admin/reports" prefetch={false} className="text-xs font-semibold text-[#176b49] hover:underline">Reports</Link>
            </div>
            {trendRows.error ? (
              <InlineError message={trendRows.error.message} />
            ) : (
              <div>
                <svg viewBox="0 0 320 126" role="img" aria-label={`Monthly complaint counts: ${trend.map((item) => `${item.month} ${item.count}`).join(", ")}`} className="h-36 w-full overflow-visible">
                  {[0, 1, 2, 3].map((line) => {
                    const y = 20 + line * 26;
                    return <line key={line} x1="20" x2="306" y1={y} y2={y} stroke="#e8efea" strokeDasharray="3 4" />;
                  })}
                  <polyline points={trendPoints(trendValues)} fill="none" stroke="#16845b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {trend.map((item, index) => {
                    const point = trendPoints(trendValues).split(" ")[index].split(",");
                    return <circle key={item.month} cx={point[0]} cy={point[1]} r="3.5" fill="white" stroke="#16845b" strokeWidth="2" />;
                  })}
                  {trend.map((item, index) => <text key={`${item.month}-label`} x={24 + index * 54} y="119" textAnchor="middle" fill="#84938a" fontSize="9">{item.month}</text>)}
                </svg>
                <div className="flex justify-between border-t border-[#eef2ef] pt-3 text-xs text-[#718178]">
                  <span>Lowest month: {minTrendValue}</span>
                  <span>Highest month: {maxTrendValue}</span>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#e4ebe6] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#193f31]">Tree cutting permits</h2>
                <p className="mt-1 text-xs text-[#829188]">Latest applications</p>
              </div>
              <Link href="/admin/permits" prefetch={false} className="text-xs font-semibold text-[#176b49] hover:underline">View all</Link>
            </div>
            {permits.error ? (
              <InlineError message={permits.error.message} />
            ) : permits.data?.length ? (
              <div className="divide-y divide-[#edf1ee]">
                {permits.data.map((permit) => (
                  <Link key={permit.id} href="/admin/permits" prefetch={false} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#345342]">{compactId(permit.id)} · {permit.applicant_name}</span>
                      <span className="mt-1 block text-xs text-[#849188]">{permit.submitted_at ? new Date(permit.submitted_at).toLocaleDateString() : "Date unavailable"}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyle(permit.application_status || "Pending")}`}>{permit.application_status || "Pending"}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState message="No permit applications yet." />
            )}
          </section>

          <section className="rounded-2xl border border-[#e4ebe6] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#193f31]">Collection schedules</h2>
                <p className="mt-1 text-xs text-[#829188]">Current published collection times</p>
              </div>
              <Link href="/admin/collection" prefetch={false} className="text-xs font-semibold text-[#176b49] hover:underline">Manage</Link>
            </div>
            {schedules.error ? (
              <InlineError message={schedules.error.message} />
            ) : schedules.data?.length ? (
              <div className="divide-y divide-[#edf1ee]">
                {schedules.data.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="truncate text-sm font-medium text-[#496252]">{schedule.barangay}</span>
                    <span className="shrink-0 rounded-full bg-[#eaf5ee] px-2.5 py-1 text-[10px] font-semibold text-[#26724c]">{schedule.collection_time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No collection schedules have been added." />
            )}
          </section>

          <section className="rounded-2xl bg-gradient-to-br from-[#0b4b37] to-[#0d7451] p-5 text-white shadow-md">
            <h2 className="text-base font-bold">Quick actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <QuickAction href="/admin/complaints" label="Review complaints" />
              <QuickAction href="/admin/permits" label="Review permits" />
              <QuickAction href="/admin/collection" label="Manage schedules" />
              <QuickAction href="/admin/collection/trip-tickets" label="Trip tickets" />
              <QuickAction href="/admin/reports" label="Generate reports" />
            </div>
          </section>
        </aside>
      </div>

      <footer className="mt-8 flex flex-col gap-3 border-t border-[#e8eeea] pt-5 text-xs text-[#87958c] sm:flex-row sm:items-center sm:justify-between">
        <span>EcoGuard · MENR administration</span>
        <div className="flex items-center gap-4">
          <span>{profile.email ?? user.email}</span>
          <LogoutButton />
        </div>
      </footer>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#edf3f0] px-3 py-5 text-[#183a30] sm:px-5">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[24px] bg-[#f9fbfa] shadow-[0_20px_70px_-30px_rgba(8,45,30,0.3)] ring-1 ring-white">
        <div className="bg-[#0b4938] px-5 py-2 text-xs font-medium text-white/85">EcoGuard · MENR Administration</div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </main>
  );
}

function AdminHeader({ name, email }: { name: string; email: string }) {
  return (
    <header className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-[#e5ece7] pb-4">
      <Link href="/admin" className="flex items-center gap-2.5" aria-label="Admin dashboard home">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#0d684b] font-bold text-white">E</span>
        <span>
          <span className="block text-base font-extrabold leading-tight text-[#173e30]">EcoGuard</span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-[#829389]">Environmental Services</span>
        </span>
      </Link>
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[#53675e]" aria-label="Admin navigation">
        <Link href="/admin" prefetch={false} className="text-[#0d684b]">Overview</Link>
        <Link href="/admin/complaints" prefetch={false} className="hover:text-[#0c684b]">Complaints</Link>
        <Link href="/admin/permits" prefetch={false} className="hover:text-[#0c684b]">Tree permits</Link>
        <Link href="/admin/collection" prefetch={false} className="hover:text-[#0c684b]">Garbage collection</Link>
        <Link href="/admin/collection/trip-tickets" prefetch={false} className="hover:text-[#0c684b]">Trip tickets</Link>
        <Link href="/admin/reports" prefetch={false} className="hover:text-[#0c684b]">Reports</Link>
      </nav>
      {email ? (
        <span className="rounded-full bg-[#edf6f0] px-3 py-2 text-xs font-semibold text-[#246847]">{name}</span>
      ) : (
        <div className="flex gap-2">
          <Link href="/login?next=%2Fadmin" className="rounded-lg border border-[#d6e3da] bg-white px-3 py-2 text-xs font-semibold text-[#15553e] hover:bg-[#f3f8f4]">Log in</Link>
          <Link href="/register" className="rounded-lg bg-[#0c684b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#09573e]">Sign up</Link>
        </div>
      )}
    </header>
  );
}

function StatCard({
  label,
  value,
  note,
  href,
  tone,
}: {
  label: string;
  value: number | null | undefined;
  note: string;
  href: string;
  tone: "rose" | "amber" | "green" | "blue";
}) {
  const iconTone = {
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-sky-50 text-sky-700",
  }[tone];

  return (
    <Link href={href} prefetch={false} className="rounded-2xl border border-[#e4ebe6] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c4d9ca] hover:shadow-md">
      <span className={`flex size-9 items-center justify-center rounded-lg text-xs font-bold ${iconTone}`} aria-hidden="true">{label.slice(0, 1)}</span>
      <span className="mt-3 block text-xs font-semibold text-[#738279]">{label}</span>
      <span className="mt-1 block text-2xl font-bold text-[#1a4131]">{value ?? "—"}</span>
      <span className="mt-1 block text-[11px] text-[#8a978f]">{note}</span>
    </Link>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} prefetch={false} className="flex min-h-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-2 py-2 text-center text-xs font-semibold text-white transition hover:bg-white/20">
      {label}
    </Link>
  );
}

function InlineError({ message }: { message: string }) {
  return <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800">{message}</p>;
}

function ErrorNotice({ message }: { message: string }) {
  return <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900">{message}</p>;
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-lg bg-[#f7faf8] px-3 py-4 text-center text-xs text-[#78887e]">{message}</p>;
}
