"use client";

import { useState } from "react";
import CollectionActions from "./CollectionActions";
import ActionMenu from "@/components/action-menu";
import ConfirmModal from "@/components/confirm-modal";
import { deleteCollectionSchedule } from "@/app/actions/collection-schedules";
import { CalendarDays, Edit, Trash2 } from "lucide-react";

type Schedule = {
  id: string;
  barangay: string;
  collection_time: string;
  truck_id: string | null;
  driver_id: string | null;
  created_at: string;
};

type CollectionSchedulesListProps = {
  initialSchedules: Schedule[];
};

export default function CollectionSchedulesList({
  initialSchedules,
}: CollectionSchedulesListProps) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [prevSchedules, setPrevSchedules] = useState(initialSchedules);
  if (initialSchedules !== prevSchedules) {
    setPrevSchedules(initialSchedules);
    setSchedules(initialSchedules);
  }

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const result = await deleteCollectionSchedule(deleteTarget.id);
    setIsDeleting(false);

    if (!result.success) {
      alert(result.error ?? "Unable to delete collection schedule.");
      return;
    }

    setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  function handleSaved(updated: {
    id: string;
    barangay: string;
    collection_time: string;
    truck_id: string | null;
    driver_id: string | null;
  }) {
    setSchedules((prev) =>
      prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
    );
    setEditingId(null);
  }

  if (schedules.length === 0) {
    return (
      <section className="card empty-state">
        No collection schedules have been created yet.
      </section>
    );
  }

  return (
    <>
      <div style={{ display: "grid", gap: "20px" }}>
        {schedules.map((schedule) => {
          const isEditing = editingId === schedule.id;

          return (
            <article key={schedule.id} className="card">
              <div
                className="card-title collection-schedule-card-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  width: "100%",
                }}
              >
                {/* Schedule Header Information (Left side) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <span
                    className="activity-icon"
                    style={{
                      background: "var(--light-green)",
                      color: "var(--primary-green)",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    <CalendarDays size={18} aria-hidden="true" />
                  </span>
                  <div style={{ minWidth: 0, flex: 1, wordBreak: "break-word" }}>
                    <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--dark-forest)", wordBreak: "break-word" }}>
                      {schedule.barangay}
                    </h2>
                    <span
                      className="muted-id"
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        display: "block",
                        wordBreak: "break-all",
                        marginTop: "2px",
                      }}
                    >
                      Schedule ID: {schedule.id}
                    </span>
                  </div>
                </div>

                {/* Upper-Right Three-Dot (⋮) Action Menu (Right side) */}
                <div style={{ flexShrink: 0, marginLeft: "auto" }}>
                  <ActionMenu
                    items={[
                      {
                        label: isEditing ? "Close Edit" : "Edit Schedule",
                        icon: <Edit size={14} />,
                        onClick: () => setEditingId(isEditing ? null : schedule.id),
                      },
                      {
                        label: "Delete Schedule",
                        icon: <Trash2 size={14} />,
                        variant: "danger",
                        onClick: () => setDeleteTarget(schedule),
                      },
                    ]}
                  />
                </div>
              </div>

              {/* Schedule Summary Information Box */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                  padding: "14px",
                  background: "var(--surface-elevated, #F8FAFC)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  margin: "12px 0 0",
                  fontSize: "13px",
                }}
              >
                <div>
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    Collection Time
                  </span>
                  <strong style={{ color: "var(--text-main)" }}>
                    {new Date(schedule.collection_time).toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    Assigned Truck
                  </span>
                  <strong style={{ color: "var(--dark-forest)" }}>
                    {schedule.truck_id ?? "Not assigned"}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    Assigned Driver
                  </span>
                  <strong style={{ color: "var(--dark-forest)" }}>
                    {schedule.driver_id ?? "Not assigned"}
                  </strong>
                </div>
              </div>

              {/* Edit Schedule Form: Revealed ONLY when "Edit Schedule" is selected */}
              {isEditing && (
                <CollectionActions
                  scheduleId={schedule.id}
                  currentBarangay={schedule.barangay}
                  currentCollectionTime={schedule.collection_time}
                  currentTruckId={schedule.truck_id}
                  currentDriverId={schedule.driver_id}
                  onCancel={() => setEditingId(null)}
                  onSaved={handleSaved}
                />
              )}
            </article>
          );
        })}
      </div>

      {/* Delete Confirmation Modal (Task 3) */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Collection Schedule"
        description={`Are you sure you want to delete the collection schedule for ${deleteTarget?.barangay}? This action cannot be undone.`}
        confirmText="Delete Schedule"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
