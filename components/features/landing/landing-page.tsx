import Link from "next/link";
import { Card } from "@/components/ui/card";

const services = [
  { title: "Report Dumping", description: "Submit illegal dumping reports and track updates.", href: "/complaints/new" },
  { title: "Tree Cutting Permit", description: "Apply for approvals and manage documents.", href: "/permits/new" },
  { title: "Garbage Collection", description: "Check collection schedules and trip tickets.", href: "/dashboard" },
];

const residentRequests = [
  { id: "CHP-4168", label: "Illegal dumping", status: "In review", tone: "bg-rose-100 text-rose-700" },
  { id: "TRP-3951", label: "Tree cutting permit", status: "Approved", tone: "bg-emerald-100 text-emerald-700" },
  { id: "GCB-7732", label: "Collection schedule", status: "Scheduled", tone: "bg-sky-100 text-sky-700" },
];

const adminStats = [
  { label: "Complaints", value: "148", change: "+12" },
  { label: "Permits", value: "12", change: "+3" },
  { label: "Trips", value: "23", change: "+8" },
  { label: "Alerts", value: "8", change: "+2" },
];

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-5 text-slate-800 md:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[0.9fr_1.2fr_1.2fr]">
        <Card className="card-shell overflow-hidden rounded-[30px] border border-white/10 bg-[#f4f7f5] text-slate-800">
          <div className="border-b border-slate-200 bg-[#f4f7f5] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                  E
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-900">EcoGuard</p>
                </div>
              </div>
              <div className="rounded-full border border-emerald-200 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-800">
                Live
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 pt-4">
            <div className="mb-4 flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
              <span className="font-medium text-slate-500">Landing Page</span>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>

            <div className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between text-[11px] font-medium text-slate-500">
                <span>EcoGuard</span>
                <span>Resident / Admin</span>
              </div>

              <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900">
                Environmental services for Mabin, made simple.
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Report issues, apply for permits, track collection schedules, and stay informed without the paperwork.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800">
                  Report Incident
                </Link>
                <Link href="/dashboard" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  View Dashboard
                </Link>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {services.map(({ title, description, href }) => (
                <Link key={title} href={href} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-700">
                      Open
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-800 p-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm">✓</span>
                <div>
                  <p className="text-sm font-semibold">Not sure where to start?</p>
                  <p className="text-xs text-emerald-50/90">Use the guided resident assistant to identify the correct service.</p>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-auto border-t border-slate-200 bg-[#edf3f2] px-5 py-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>EcoGuard</span>
              <span>© 2026</span>
            </div>
          </footer>
        </Card>

        <Card className="card-shell overflow-hidden rounded-[30px] border border-white/10 bg-[#f4f7f5] text-slate-800">
          <div className="border-b border-slate-200 bg-[#f4f7f5] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Main Dashboard • Resident (User)</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Online
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 pt-4">
            <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Welcome back,</p>
                  <h2 className="text-2xl font-bold text-slate-900">Maria</h2>
                </div>
                <Link href="/login" className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  Login
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Link href="/complaints/new" className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:bg-slate-100">
                  <p className="text-xs text-slate-500">Report</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">Illegal dumping</p>
                </Link>
                <Link href="/permits/new" className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:bg-slate-100">
                  <p className="text-xs text-slate-500">Apply</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">Tree cutting</p>
                </Link>
                <Link href="/dashboard" className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:bg-slate-100">
                  <p className="text-xs text-slate-500">Track</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">Collection</p>
                </Link>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">My requests</h3>
                <Link href="/complaints" className="text-xs font-medium text-emerald-700">View all</Link>
              </div>

              <div className="space-y-3">
                {residentRequests.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{item.id}</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{item.label}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.tone}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <footer className="border-t border-slate-200 bg-[#edf3f2] px-4 py-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>EcoGuard</span>
              <span>Services • Quick links • Contact</span>
            </div>
          </footer>
        </Card>

        <Card className="card-shell overflow-hidden rounded-[30px] border border-white/10 bg-[#f4f7f5] text-slate-800">
          <div className="border-b border-slate-200 bg-[#f4f7f5] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Main Dashboard • MENR Admin</span>
              </div>
              <div className="rounded-full border border-emerald-200 bg-white px-2 py-1 text-[10px] font-semibold text-emerald-800">
                Admin
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 pt-4">
            <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Operations</p>
                  <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
                </div>
                <Link href="/admin" className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">
                  Open</Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {adminStats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                    <div className="mt-3 flex items-end justify-between">
                      <span className="text-2xl font-bold text-slate-900">{item.value}</span>
                      <span className="text-[10px] font-semibold text-emerald-700">{item.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Recent complaints</h3>
                  <span className="text-[10px] font-medium text-slate-500">Today</span>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2 py-1.5">
                    <span>Illegal dumping</span>
                    <span className="text-rose-600">Pending</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2 py-1.5">
                    <span>Tree cutting</span>
                    <span className="text-emerald-600">Approved</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Quick actions</h3>
                  <span className="text-[10px] font-medium text-slate-500">Monitor</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <Link href="/admin/complaints" className="rounded-xl bg-slate-100 px-2 py-2 text-center font-medium text-slate-700">Complaints</Link>
                  <Link href="/admin/permits" className="rounded-xl bg-slate-100 px-2 py-2 text-center font-medium text-slate-700">Permits</Link>
                  <Link href="/admin/collection" className="rounded-xl bg-slate-100 px-2 py-2 text-center font-medium text-slate-700">Collections</Link>
                  <Link href="/admin/reports" className="rounded-xl bg-slate-100 px-2 py-2 text-center font-medium text-slate-700">Reports</Link>
                </div>
              </div>
            </div>
          </div>

          <footer className="border-t border-slate-200 bg-[#edf3f2] px-4 py-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>EcoGuard</span>
              <span>Admin • MENR</span>
            </div>
          </footer>
        </Card>
      </div>
    </main>
  );
}
