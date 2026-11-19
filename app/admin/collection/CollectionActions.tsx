"use client";

import { useState } from "react";
import { updateCollectionSchedule } from "@/app/actions/collection-schedules";
import { Check, LoaderCircle } from "lucide-react";

type CollectionActionsProps = {
  scheduleId: string;
  currentBarangay: string;
  currentCollectionTime: string;
  currentTruckId: string | null;
  currentDriverId: string | null;
  onCancel?: () => void;
  onSaved?: (updated: {
    id: string;
    barangay: string;
    collection_time: string;
    truck_id: string | null;
    driver_id: string | null;
  }) => void;
};

export default function CollectionActions({
  scheduleId,
  currentBarangay,
  currentCollectionTime,
  currentTruckId,
  currentDriverId,
  onCancel,
  onSaved,
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

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
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

    if (onSaved) {
      onSaved({
        id: scheduleId,
        barangay: barangay.trim(),
        collection_time: collectionTime,
        truck_id: truckId.trim() || null,
        driver_id: driverId.trim() || null,
      });
    }
  }

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "16px",
        background: "var(--surface-elevated, #F8FAFC)",
        borderRadius: "10px",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ marginBottom: "14px" }}>
        <h3 style={{ color: "var(--dark-forest)", fontSize: "14px", fontWeight: 700, margin: 0 }}>
          Edit Schedule Details
        </h3>
      </div>

      <form onSubmit={handleUpdate} className="form-grid">
        <div className="form-field">
          <label htmlFor={`barangay-${scheduleId}`}>
            Barangay / Area <span aria-hidden="true">*</span>
          </label>
          <input
            id={`barangay-${scheduleId}`}
            type="text"
            value={barangay}
            disabled={loading}
            required
            onChange={(event) => setBarangay(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`collection-time-${scheduleId}`}>
            Collection Time <span aria-hidden="true">*</span>
          </label>
          <input
            id={`collection-time-${scheduleId}`}
            type="datetime-local"
            value={collectionTime}
            disabled={loading}
            required
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

        <div
          className="form-actions full"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            marginTop: "12px",
          }}
        >
          {onCancel && (
            <button
              type="button"
              className="button secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="button green"
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle className="spin" size={15} aria-hidden="true" />
            ) : null}
            Save Changes
          </button>
        </div>
      </form>

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
