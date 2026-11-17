"use client";

import { useState } from "react";
import {
  updateCollectionSchedule,
  deleteCollectionSchedule,
} from "@/app/actions/collection-schedules";
import { Check, LoaderCircle, Trash2 } from "lucide-react";

type CollectionActionsProps = {
  scheduleId: string;
  currentBarangay: string;
  currentCollectionTime: string;
  currentTruckId: string | null;
  currentDriverId: string | null;
};

export default function CollectionActions({
  scheduleId,
  currentBarangay,
  currentCollectionTime,
  currentTruckId,
  currentDriverId,
}: CollectionActionsProps) {
  const [barangay, setBarangay] = useState(currentBarangay);
  const [collectionTime, setCollectionTime] = useState(
    currentCollectionTime.slice(0, 16)
  );
  const [truckId, setTruckId] = useState(currentTruckId ?? "");
  const [driverId, setDriverId] = useState(currentDriverId ?? "");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpdate() {
    setLoading(true);
    setMessage("");
    setError("");

    const result = await updateCollectionSchedule(
      scheduleId,
      barangay,
      collectionTime,
      truckId,
      driverId
    );

    if (!result.success) {
      setError(
        result.error ?? "Unable to update collection schedule."
      );
      setLoading(false);
      return;
    }

    setMessage("Collection schedule updated successfully.");
    setLoading(false);
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this collection schedule?"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    const result = await deleteCollectionSchedule(scheduleId);

    if (!result.success) {
      setError(
        result.error ?? "Unable to delete collection schedule."
      );
      setLoading(false);
      return;
    }

    setMessage("Collection schedule deleted successfully.");
    window.location.reload();
  }

  return (
    <div
      style={{
        marginTop: "16px",
        paddingTop: "16px",
        borderTop: "1px solid var(--border)",
      }}
    >
      <h3 style={{ color: "var(--dark-forest)", fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>
        Edit Schedule Details
      </h3>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor={`barangay-${scheduleId}`}>Barangay</label>
          <input
            id={`barangay-${scheduleId}`}
            type="text"
            value={barangay}
            disabled={loading}
            onChange={(event) => setBarangay(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`collection-time-${scheduleId}`}>
            Collection Time
          </label>
          <input
            id={`collection-time-${scheduleId}`}
            type="datetime-local"
            value={collectionTime}
            disabled={loading}
            onChange={(event) =>
              setCollectionTime(event.target.value)
            }
          />
        </div>

        <div className="form-field">
          <label htmlFor={`truck-${scheduleId}`}>Truck Identifier</label>
          <input
            id={`truck-${scheduleId}`}
            type="text"
            value={truckId}
            disabled={loading}
            onChange={(event) => setTruckId(event.target.value)}
            placeholder="e.g. TRUCK-001"
          />
        </div>

        <div className="form-field">
          <label htmlFor={`driver-${scheduleId}`}>Driver ID</label>
          <input
            id={`driver-${scheduleId}`}
            type="text"
            value={driverId}
            disabled={loading}
            onChange={(event) => setDriverId(event.target.value)}
            placeholder="e.g. DRIVER-001"
          />
        </div>

        <div className="form-actions full" style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button
            type="button"
            className="button green"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle className="spin" size={15} aria-hidden="true" />
            ) : null}
            Update Schedule
          </button>

          <button
            type="button"
            className="button danger"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 size={15} aria-hidden="true" /> Delete Schedule
          </button>
        </div>
      </div>

      {error && (
        <div className="notice error" role="alert" style={{ marginTop: "12px" }}>
          {error}
        </div>
      )}

      {message && (
        <div className="notice success" role="status" style={{ marginTop: "12px" }}>
          <Check size={14} style={{ display: "inline-block", marginRight: "6px" }} />
          {message}
        </div>
      )}
    </div>
  );
}
