"use client";

import { useState } from "react";
import {
  updateCollectionSchedule,
  deleteCollectionSchedule,
} from "@/app/actions/collection-schedules";

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

    // Refresh the page so the deleted schedule disappears.
    window.location.reload();
  }

  return (
    <div
      style={{
        marginTop: "20px",
        paddingTop: "20px",
        borderTop: "1px solid #eee",
      }}
    >
      <h3
        style={{
          marginBottom: "15px",
        }}
      >
        Schedule Actions
      </h3>

      <label
        htmlFor={`barangay-${scheduleId}`}
        style={{
          display: "block",
          fontWeight: "600",
          marginBottom: "8px",
        }}
      >
        Barangay
      </label>

      <input
        id={`barangay-${scheduleId}`}
        type="text"
        value={barangay}
        disabled={loading}
        onChange={(event) => setBarangay(event.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxSizing: "border-box",
        }}
      />

      <label
        htmlFor={`collection-time-${scheduleId}`}
        style={{
          display: "block",
          fontWeight: "600",
          marginTop: "15px",
          marginBottom: "8px",
        }}
      >
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
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxSizing: "border-box",
        }}
      />

      <label
        htmlFor={`truck-${scheduleId}`}
        style={{
          display: "block",
          fontWeight: "600",
          marginTop: "15px",
          marginBottom: "8px",
        }}
      >
        Truck ID
      </label>

      <input
        id={`truck-${scheduleId}`}
        type="text"
        value={truckId}
        disabled={loading}
        onChange={(event) => setTruckId(event.target.value)}
        placeholder="Example: TRUCK-001"
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxSizing: "border-box",
        }}
      />

      <label
        htmlFor={`driver-${scheduleId}`}
        style={{
          display: "block",
          fontWeight: "600",
          marginTop: "15px",
          marginBottom: "8px",
        }}
      >
        Driver ID
      </label>

      <input
        id={`driver-${scheduleId}`}
        type="text"
        value={driverId}
        disabled={loading}
        onChange={(event) => setDriverId(event.target.value)}
        placeholder="Example: DRIVER-001"
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxSizing: "border-box",
        }}
      />

      <button
        type="button"
        onClick={handleUpdate}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: "15px",
          padding: "12px",
          border: "none",
          borderRadius: "8px",
          background: loading ? "#999" : "#166534",
          color: "white",
          fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Processing..." : "Update Schedule"}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: "10px",
          padding: "12px",
          border: "none",
          borderRadius: "8px",
          background: loading ? "#999" : "#dc2626",
          color: "white",
          fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        Delete Schedule
      </button>

      {error && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "8px",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}