import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PermitsFilterableList from "./PermitsFilterableList";
import AppShell from "@/components/app-shell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminPermitsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Access Error</h1>
        <p>Unable to verify your account role.</p>
      </main>
    );
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: applications, error: applicationsError } =
    await supabase
      .from("permit_applications")
      .select(
        "id, user_id, applicant_name, documentary_requirements, application_status, submitted_at"
      )
      .order("submitted_at", { ascending: false });

  if (applicationsError) {
    return (
      <AppShell
        mode="admin"
        userName={profile.full_name || "MENR Administrator"}
        email={profile.email || user.email}
      >
        <div className="notice error">
          Unable to load permit applications: {applicationsError.message}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      mode="admin"
      userName={profile.full_name || "MENR Administrator"}
      email={profile.email || user.email}
    >
      <div className="page-header">
        <div>
          <p className="eyebrow">MENR OPERATIONS • MABINI</p>
          <h1 className="page-title">Tree Cutting Permit Management</h1>
          <p className="page-subtitle">
            Review applicant documents, evaluate environmental clearance, and update permit statuses.
          </p>
        </div>
        <Link className="button secondary" href="/admin">
          <ArrowLeft size={16} aria-hidden="true" /> Back to Dashboard
        </Link>
      </div>

      <PermitsFilterableList applications={applications ?? []} />
    </AppShell>
  );
}
