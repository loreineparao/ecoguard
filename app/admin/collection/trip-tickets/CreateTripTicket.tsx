"use client";

import { useState } from "react";
import { createTripTicket } from "@/app/actions/trip-tickets";

type Schedule = {
  id: string;
  barangay: string;
  collection_time: string;
  truck_id: string | null;
  driver_id: string | null;
};

type CreateTripTicketProps = {
  schedules: Schedule[];
};

export default function CreateTripTicket({
  schedules,
}: CreateTripTicketProps) {
  const [scheduleId, setScheduleId] = useState(
    schedules[0]?.id ?? ""
  );

  const [estimatedLoad, setEstimatedLoad] = useState("");
  const [actualCollectionTime, setActualCollectionTime] =
    useState("");
  const [driverName, setDriverName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (!scheduleId) {
      setError("Please select a collection schedule.");
      setLoading(false);
      return;
    }

    const result = await createTripTicket(
      scheduleId,
      estimatedLoad,
      actualCollectionTime,
      driverName,
      plateNumber
    );

    if (!result.success) {
      setError(
        result.error ?? "Unable to create trip ticket."
      );
      setLoading(false);
      return;
    }

    setMessage("Trip ticket created successfully.");

    setEstimatedLoad("");
    setActualCollectionTime("");
    setDriverName("");
    setPlateNumber("");

    setLoading(false);

    window.location.reload();
  }

  return (
    <div
      style={{
        marginBottom: "30px",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        background: "#f9fafb",
      }}
    >
      <h2 style={{ marginBottom: "15px" }}>
        Create Trip Ticket
      </h2>

      {schedules.length === 0 ? (
        <p style={{ color: "#991b1b" }}>
          No collection schedules are available. Please create
          a collection schedule first.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* COLLECTION SCHEDULE */}
          <label
            htmlFor="schedule"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Collection Schedule
          </label>

          <select
            id="schedule"
            value={scheduleId}
            onChange={(event) =>
              setScheduleId(event.target.value)
            }
            disabled={loading}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              background: "white",
            }}
          >
            {schedules.map((schedule) => (
              <option
                key={schedule.id}
                value={schedule.id}
              >
                {schedule.barangay} —{" "}
                {new Date(
                  schedule.collection_time
                ).toLocaleString()}
              </option>
            ))}
          </select>

          {/* ESTIMATED LOAD */}
          <label
            htmlFor="estimated-load"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Estimated Load
          </label>

          <input
            id="estimated-load"
            type="text"
            value={estimatedLoad}
            onChange={(event) =>
              setEstimatedLoad(event.target.value)
            }
            placeholder="Example: 5 tons"
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              boxSizing: "border-box",
            }}
          />

          {/* ACTUAL COLLECTION TIME */}
          <label
            htmlFor="actual-collection-time"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Actual Collection Time
          </label>

          <input
            id="actual-collection-time"
            type="datetime-local"
            value={actualCollectionTime}
            onChange={(event) =>
              setActualCollectionTime(event.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              boxSizing: "border-box",
            }}
          />

          {/* DRIVER NAME */}
          <label
            htmlFor="driver-name"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Driver Name
          </label>

          <input
            id="driver-name"
            type="text"
            value={driverName}
            onChange={(event) =>
              setDriverName(event.target.value)
            }
            placeholder="Enter driver name"
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              boxSizing: "border-box",
            }}
          />

          {/* PLATE NUMBER */}
          <label
            htmlFor="plate-number"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Plate Number
          </label>

          <input
            id="plate-number"
            type="text"
            value={plateNumber}
            onChange={(event) =>
              setPlateNumber(event.target.value)
            }
            placeholder="Example: ABC-1234"
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              boxSizing: "border-box",
            }}
          />

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              background: loading ? "#999" : "#166534",
              color: "white",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Creating..."
              : "Create Trip Ticket"}
          </button>
        </form>
      )}

      {/* ERROR MESSAGE */}
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

      {/* SUCCESS MESSAGE */}
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