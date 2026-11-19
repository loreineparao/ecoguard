"use client";

import { useState } from "react";
import { updateTripTicket } from "@/app/actions/update-trip-ticket";
import { Check, LoaderCircle } from "lucide-react";

type TripTicketActionsProps = {
  ticketId: string;
  currentEstimatedLoad: string | null;
  currentActualCollectionTime: string | null;
  currentDriverName: string;
  currentPlateNumber: string;
  onCancel?: () => void;
  onSaved?: (updated: {
    id: string;
    driver_name: string;
    plate_number: string;
    estimated_load: string | null;
    actual_collection_time: string | null;
  }) => void;
};

export default function TripTicketActions({
  ticketId,
  currentEstimatedLoad,
  currentActualCollectionTime,
  currentDriverName,
  currentPlateNumber,
  onCancel,
  onSaved,
}: TripTicketActionsProps) {
  const [estimatedLoad, setEstimatedLoad] = useState(
    currentEstimatedLoad ?? ""
  );

  const [actualCollectionTime, setActualCollectionTime] = useState(
    currentActualCollectionTime
      ? currentActualCollectionTime.slice(0, 16)
      : ""
  );

  const [driverName, setDriverName] = useState(currentDriverName);
  const [plateNumber, setPlateNumber] = useState(currentPlateNumber);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const result = await updateTripTicket(
      ticketId,
      estimatedLoad,
      actualCollectionTime,
      driverName,
      plateNumber
    );

    if (!result.success) {
      setError(result.error ?? "Unable to update trip ticket.");
      setLoading(false);
      return;
    }

    setMessage("Trip ticket updated successfully.");
    setLoading(false);

    if (result.ticket && onSaved) {
      onSaved(result.ticket);
    }
  }

  function handleCancel() {
    setEstimatedLoad(currentEstimatedLoad ?? "");
    setActualCollectionTime(
      currentActualCollectionTime
        ? currentActualCollectionTime.slice(0, 16)
        : ""
    );
    setDriverName(currentDriverName);
    setPlateNumber(currentPlateNumber);
    setError("");
    setMessage("");
    if (onCancel) {
      onCancel();
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
          Edit Trip Ticket Details
        </h3>
      </div>

      <form onSubmit={handleUpdate} className="form-grid">
        <div className="form-field">
          <label htmlFor={`driver-${ticketId}`}>
            Driver Name <span aria-hidden="true">*</span>
          </label>
          <input
            id={`driver-${ticketId}`}
            type="text"
            value={driverName}
            disabled={loading}
            required
            onChange={(event) => setDriverName(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`plate-${ticketId}`}>
            Plate Number <span aria-hidden="true">*</span>
          </label>
          <input
            id={`plate-${ticketId}`}
            type="text"
            value={plateNumber}
            disabled={loading}
            required
            onChange={(event) => setPlateNumber(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`load-${ticketId}`}>Estimated Load</label>
          <input
            id={`load-${ticketId}`}
            type="text"
            value={estimatedLoad}
            disabled={loading}
            onChange={(event) => setEstimatedLoad(event.target.value)}
            placeholder="e.g. 3.5 tons"
          />
        </div>

        <div className="form-field">
          <label htmlFor={`actual-time-${ticketId}`}>
            Actual Collection Time <span aria-hidden="true">*</span>
          </label>
          <input
            id={`actual-time-${ticketId}`}
            type="datetime-local"
            value={actualCollectionTime}
            disabled={loading}
            required
            onChange={(event) => setActualCollectionTime(event.target.value)}
          />
        </div>

        <div className="form-actions full" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
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

          {onCancel && (
            <button
              type="button"
              className="button secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}
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
