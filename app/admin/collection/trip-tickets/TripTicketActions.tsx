"use client";

import { useState } from "react";
import { updateTripTicket } from "@/app/actions/update-trip-ticket";
import { deleteTripTicket } from "@/app/actions/delete-trip-ticket";
import { Check, LoaderCircle, Trash2 } from "lucide-react";

type TripTicketActionsProps = {
  ticketId: string;
  currentEstimatedLoad: string | null;
  currentActualCollectionTime: string | null;
  currentDriverName: string;
  currentPlateNumber: string;
};

export default function TripTicketActions({
  ticketId,
  currentEstimatedLoad,
  currentActualCollectionTime,
  currentDriverName,
  currentPlateNumber,
}: TripTicketActionsProps) {
  const [estimatedLoad, setEstimatedLoad] = useState(
    currentEstimatedLoad ?? ""
  );

  const [actualCollectionTime, setActualCollectionTime] =
    useState(
      currentActualCollectionTime
        ? currentActualCollectionTime.slice(0, 16)
        : ""
    );

  const [driverName, setDriverName] = useState(
    currentDriverName
  );

  const [plateNumber, setPlateNumber] = useState(
    currentPlateNumber
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpdate() {
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
      setError(
        result.error ?? "Unable to update trip ticket."
      );
      setLoading(false);
      return;
    }

    setMessage("Trip ticket updated successfully.");
    setLoading(false);
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this trip ticket?"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    const result = await deleteTripTicket(ticketId);

    if (!result.success) {
      setError(
        result.error ?? "Unable to delete trip ticket."
      );
      setLoading(false);
      return;
    }

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
        Edit Trip Ticket Details
      </h3>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor={`driver-${ticketId}`}>Driver Name</label>
          <input
            id={`driver-${ticketId}`}
            type="text"
            value={driverName}
            disabled={loading}
            onChange={(event) =>
              setDriverName(event.target.value)
            }
          />
        </div>

        <div className="form-field">
          <label htmlFor={`plate-${ticketId}`}>Plate Number</label>
          <input
            id={`plate-${ticketId}`}
            type="text"
            value={plateNumber}
            disabled={loading}
            onChange={(event) =>
              setPlateNumber(event.target.value)
            }
          />
        </div>

        <div className="form-field">
          <label htmlFor={`load-${ticketId}`}>Estimated Load</label>
          <input
            id={`load-${ticketId}`}
            type="text"
            value={estimatedLoad}
            disabled={loading}
            onChange={(event) =>
              setEstimatedLoad(event.target.value)
            }
            placeholder="e.g. 3 tons"
          />
        </div>

        <div className="form-field">
          <label htmlFor={`actual-time-${ticketId}`}>
            Actual Collection Time
          </label>
          <input
            id={`actual-time-${ticketId}`}
            type="datetime-local"
            value={actualCollectionTime}
            disabled={loading}
            onChange={(event) =>
              setActualCollectionTime(event.target.value)
            }
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
            Update Trip Ticket
          </button>

          <button
            type="button"
            className="button danger"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 size={15} aria-hidden="true" /> Delete Ticket
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
