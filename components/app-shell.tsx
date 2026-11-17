"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import FloatingAIAssistant from "@/components/floating-ai-assistant";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  MessageSquare,
  TreePine,
  FileCheck,
  CalendarDays,
  Truck,
  ChartNoAxesCombined,
  LogOut,
  CircleHelp,
  Settings,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  User,
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
  { href: "/complaints/new", label: "Submit Complaint", icon: PlusCircle },
  { href: "/complaints", label: "My Complaints", icon: MessageSquare },
  { href: "/permits/new", label: "Tree Cutting Permit", icon: TreePine },
  { href: "/permits", label: "My Applications", icon: FileCheck },
];

const adminLinks: NavLink[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/complaints", label: "Complaints", icon: MessageSquare },
  { href: "/admin/permits", label: "Permit Management", icon: FileCheck },
  {
    href: "/admin/collection",
    label: "Collection Schedules",
    icon: CalendarDays,
  },
  {
    href: "/admin/collection/trip-tickets",
    label: "Trip Tickets",
    icon: Truck,
  },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const links = mode === "admin" ? adminLinks : residentLinks;

  // Close navigation and profile dropdown on route change without triggering cascading effects
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }

  // Close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileDropdownOpen(false);
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileDropdownOpen]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EG";

  async function handleLogout() {
    setMobileMenuOpen(false);
    const { error } = await createClient().auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Fixed Sidebar on Desktop / Collapsible Navigation Drawer on Mobile */}
      <aside
        className={`sidebar ${mobileMenuOpen ? "open" : ""}`}
        aria-label="Sidebar navigation"
      >
        <div className="sidebar-top-row">
          <Link
            href={mode === "admin" ? "/admin" : "/dashboard"}
            className="brand"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="brand-mark">
              <ShieldCheck size={22} aria-hidden="true" />
            </span>
            <span>
              <strong>EcoGuard</strong>
              <small>
                {mode === "admin" ? "MENR Office" : "Resident Portal"}
              </small>
            </span>
          </Link>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            title="Close menu"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <div className="sidebar-label">
          {mode === "admin" ? "MENR Workspace" : "Resident Portal"}
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/dashboard" &&
                link.href !== "/admin" &&
                link.href !== "/complaints" &&
                link.href !== "/permits" &&
                link.href !== "/admin/collection" &&
                pathname.startsWith(`${link.href}/`));

            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${active ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.9} />
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon">
              <CircleHelp size={17} />
            </span>
            <div>
              <strong>Need Assistance?</strong>
              <small>MENR Office, Mabini</small>
            </div>
          </div>
        </div>
      </aside>

      {/* App Main Area (Scrollable Content) */}
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              title="Open menu"
            >
              <Menu size={21} aria-hidden="true" />
            </button>

            <Link
              href={mode === "admin" ? "/admin" : "/dashboard"}
              className="topbar-brand"
            >
              <span className="topbar-brand-mark">
                <ShieldCheck size={18} aria-hidden="true" />
              </span>
              <strong className="topbar-brand-name">EcoGuard</strong>
            </Link>

            <span className="topbar-divider" aria-hidden="true" />

            <div className="topbar-context">
              {mode === "admin"
                ? "MENR OFFICE • MABINI, BATANGAS"
                : "RESIDENT PORTAL • MABINI, BATANGAS"}
            </div>
          </div>

          {/* Profile Dropdown Section in Top-Right Header */}
          <div className="user-menu-wrapper" ref={profileMenuRef}>
            <button
              type="button"
              className={`user-menu-trigger ${profileDropdownOpen ? "active" : ""}`}
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              aria-expanded={profileDropdownOpen}
              aria-haspopup="true"
              aria-label="User profile and account settings"
            >
              <span className="avatar">{initials}</span>
              <span className="user-copy">
                <strong>{userName || "EcoGuard Resident"}</strong>
                <small>
                  {email || (mode === "admin" ? "Administrator" : "Resident")}
                </small>
              </span>
              <ChevronDown
                size={14}
                className={`user-menu-chevron ${profileDropdownOpen ? "rotated" : ""}`}
                aria-hidden="true"
              />
            </button>

            {profileDropdownOpen && (
              <div
                className="profile-dropdown-card"
                role="menu"
                aria-label="User profile menu"
              >
                <div className="profile-dropdown-header">
                  <div className="profile-dropdown-avatar">{initials}</div>
                  <div className="profile-dropdown-info">
                    <strong className="profile-dropdown-name">
                      {userName || (mode === "admin" ? "Administrator" : "EcoGuard Resident")}
                    </strong>
                    <span className="profile-dropdown-email" title={email || ""}>
                      {email || "Registered Resident"}
                    </span>
                    <span className="profile-dropdown-badge">
                      <ShieldCheck size={11} aria-hidden="true" />
                      {mode === "admin" ? "MENR Administrator" : "Verified Resident"}
                    </span>
                  </div>
                </div>

                <div className="profile-dropdown-divider" />

                <div className="profile-dropdown-menu-list">
                  <Link
                    href="/settings"
                    className="profile-dropdown-item"
                    onClick={() => setProfileDropdownOpen(false)}
                    role="menuitem"
                  >
                    <span className="profile-dropdown-icon">
                      <User size={15} aria-hidden="true" />
                    </span>
                    <div className="profile-dropdown-item-text">
                      <strong>Profile Information</strong>
                      <small>View personal details & barangay</small>
                    </div>
                  </Link>

                  <Link
                    href="/settings"
                    className="profile-dropdown-item"
                    onClick={() => setProfileDropdownOpen(false)}
                    role="menuitem"
                  >
                    <span className="profile-dropdown-icon">
                      <Settings size={15} aria-hidden="true" />
                    </span>
                    <div className="profile-dropdown-item-text">
                      <strong>Settings</strong>
                      <small>Account preferences & password</small>
                    </div>
                  </Link>
                </div>

                <div className="profile-dropdown-divider" />

                <div className="profile-dropdown-footer">
                  <button
                    type="button"
                    className="profile-dropdown-logout-btn"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    role="menuitem"
                  >
                    <LogOut size={15} aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>

      {/* Floating AI Assistant (Only for resident mode) */}
      {mode === "resident" && <FloatingAIAssistant />}
    </div>
  );
}
