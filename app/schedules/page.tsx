import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, MapPin, Truck } from "lucide-react";
import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

type Schedule = {
  id: string;
  barangay: string;
  collection_time: string;
  truck_id: string | null;
  driver_id: string | null;
};

export default async function ResidentSchedulesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: schedules, error }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("collection_schedules")
      .select("id, barangay, collection_time, truck_id, driver_id")
      .order("collection_time", { ascending: true }),
  ]);

  if (profile?.role === "admin") redirect("/admin");

  const items = (schedules ?? []) as Schedule[];
  const name =
    profile?.full_name || user.user_metadata?.full_name || "Resident";

  return (
    <AppShell
      mode="resident"
      userName={name}
      email={profile?.email ?? user.email}
    >
      <div className="page-header">
        <div>
          <p className="eyebrow">RESIDENT PORTAL • MABINI</p>
          <h1 className="page-title">Garbage Collection Schedules</h1>
          <p className="page-subtitle">
            View municipal waste collection times published by the MENR Office.
          </p>
        </div>
        <Link className="button secondary" href="/dashboard">
          <ArrowLeft size={16} aria-hidden="true" /> Back to Dashboard
        </Link>
      </div>

      <section className="card">
        <div className="card-title">
          <div>
            <h2>Community Collection Schedules</h2>
            <p className="hint">
              Schedules are maintained and updated regularly by the MENR Office.
            </p>
          </div>
          <CalendarDays size={20} color="var(--primary-green)" aria-hidden="true" />
        </div>

        {error ? (
          <div className="notice error" role="alert">
            Unable to load collection schedules right now. Please try again later.
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            No collection schedules have been published yet.
          </div>
        ) : (
          <div className="schedule-grid">
            {items.map((schedule) => {
              const date = new Date(schedule.collection_time);
              return (
                <article className="schedule-card" key={schedule.id}>
                  <h3>{schedule.barangay}</h3>
                  <p className="schedule-detail">
                    <CalendarDays size={15} aria-hidden="true" />
                    <span>
                      Date: <strong>{date.toLocaleDateString()}</strong>
                    </span>
                  </p>
                  <p className="schedule-detail">
                    <Clock3 size={15} aria-hidden="true" />
                    <span>
                      Time:{" "}
                      <strong>
                        {date.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </strong>
                    </span>
                  </p>
                  <p className="schedule-detail">
                    <MapPin size={15} aria-hidden="true" />
                    <span>
                      Area: <strong>{schedule.barangay}</strong>
                    </span>
                  </p>
                  {schedule.truck_id && (
                    <p className="schedule-detail">
                      <Truck size={15} aria-hidden="true" />
                      <span>Truck: {schedule.truck_id}</span>
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
