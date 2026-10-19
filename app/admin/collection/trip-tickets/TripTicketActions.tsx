"use client";

import { useState } from "react";
import { updateTripTicket } from "@/app/actions/update-trip-ticket";
import { deleteTripTicket } from "@/app/actions/delete-trip-ticket";

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
        Trip Ticket Actions
      </h3>

      <label
        htmlFor={`load-${ticketId}`}
        style={{
          display: "block",
          fontWeight: "600",
          marginBottom: "8px",
        }}
      >
        Estimated Load
      </label>

      <input
        id={`load-${ticketId}`}
        type="text"
        value={estimatedLoad}
        disabled={loading}
        onChange={(event) =>
          setEstimatedLoad(event.target.value)
        }
        placeholder="Example: 2 tons"
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxSizing: "border-box",
        }}
      />

      <label
        htmlFor={`actual-time-${ticketId}`}
        style={{
          display: "block",
          fontWeight: "600",
          marginTop: "15px",
          marginBottom: "8px",
        }}
      >
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
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxSizing: "border-box",
        }}
      />

      <label
        htmlFor={`driver-${ticketId}`}
        style={{
          display: "block",
          fontWeight: "600",
          marginTop: "15px",
          marginBottom: "8px",
        }}
      >
        Driver Name
      </label>

      <input
        id={`driver-${ticketId}`}
        type="text"
        value={driverName}
        disabled={loading}
        onChange={(event) =>
          setDriverName(event.target.value)
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
        htmlFor={`plate-${ticketId}`}
        style={{
          display: "block",
          fontWeight: "600",
          marginTop: "15px",
          marginBottom: "8px",
        }}
      >
        Plate Number
      </label>

      <input
        id={`plate-${ticketId}`}
        type="text"
        value={plateNumber}
        disabled={loading}
        onChange={(event) =>
          setPlateNumber(event.target.value)
        }
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
        {loading ? "Processing..." : "Update Trip Ticket"}
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
        Delete Trip Ticket
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