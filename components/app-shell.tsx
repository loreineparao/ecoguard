
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  MessageSquare,
  TreePine,
  FileCheck,
  Sparkles,
  CalendarDays,
  Truck,
  ChartNoAxesCombined,
  LogOut,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";

type AppShellProps = {
  children: ReactNode;
  mode: "resident" | "admin";
  userName: string;
  email?: string | null;
};

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const residentLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/complaints/new", label: "Submit complaint", icon: PlusCircle },
  { href: "/complaints", label: "My complaints", icon: MessageSquare },
  { href: "/permits/new", label: "Tree cutting permit", icon: TreePine },
  { href: "/permits", label: "My applications", icon: FileCheck },
  { href: "/ai-assistant", label: "AI assistant", icon: Sparkles },
];

const adminLinks: NavLink[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/complaints", label: "Complaints", icon: MessageSquare },
  { href: "/admin/permits", label: "Permit management", icon: FileCheck },
  { href: "/admin/collection", label: "Collection schedules", icon: CalendarDays },
  { href: "/admin/collection/trip-tickets", label: "Trip tickets", icon: Truck },
  { href: "/admin/reports", label: "Reports", icon: ChartNoAxesCombined },
];

export default function AppShell({
  children,
  mode,
  userName,
  email,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const links = mode === "admin" ? adminLinks : residentLinks;

  const initials =
    userName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EG";

  async function handleLogout() {
    const { error } = await createClient().auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      return;
    }

    router.push("/login");
    router.refresh();
  }
  <button
  type="button"
  className="logout-link"
  onClick={handleLogout}
>
  <LogOut size={16} aria-hidden="true" />
  Sign out
</button>

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link
          href={mode === "admin" ? "/admin" : "/dashboard"}
          className="brand"
        >
          <span className="brand-mark">E</span>
          <span>
            <strong>EcoGuard</strong>
            <small>
              {mode === "admin" ? "MENR Office" : "Resident portal"}
            </small>
          </span>
        </Link>

        <div className="sidebar-label">Workspace</div>

        <nav className="nav-list" aria-label="Primary navigation">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/dashboard" &&
                pathname.startsWith(`${link.href}/`));

            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${active ? "active" : ""}`}
              >
                <span className="nav-icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon">
              <CircleHelp size={20} />
            </span>
            <div>
              <strong>Need help?</strong>
              <small>Contact the MENR office</small>
            </div>
          </div>

          <button
            type="button"
            className="logout-link"
            onClick={handleLogout}
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
            </aside>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" &&
              pathname.startsWith(`${link.href}/`));

          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`mobile-nav-link ${active ? "active" : ""}`}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <section className="app-main">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">E</span>
            <strong>EcoGuard</strong>
          </div>

          <div className="topbar-spacer" />

          <div className="user-menu">
            <span className="avatar">{initials}</span>
            <span className="user-copy">
              <strong>{userName || "EcoGuard user"}</strong>
              <small>
                {email || (mode === "admin" ? "Administrator" : "Resident")}
              </small>
            </span>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </section>
    </div>
  );
}
