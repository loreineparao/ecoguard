"use client";

import { useState } from "react";
import { createCollectionSchedule } from "@/app/actions/collection-schedules";

export default function CreateCollectionSchedule() {
  const [barangay, setBarangay] = useState("");
  const [collectionTime, setCollectionTime] = useState("");
  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");

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

    const result = await createCollectionSchedule(
      barangay,
      collectionTime,
      truckId,
      driverId
    );

    if (!result.success) {
      setError(
        result.error ?? "Unable to create collection schedule."
      );
      setLoading(false);
      return;
    }

    setMessage("Collection schedule created successfully.");

    setBarangay("");
    setCollectionTime("");
    setTruckId("");
    setDriverId("");

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
        Create Collection Schedule
      </h2>

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="barangay"
          style={{
            display: "block",
            fontWeight: "600",
            marginBottom: "8px",
          }}
        >
          Barangay
        </label>

        <input
          id="barangay"
          type="text"
          value={barangay}
          onChange={(event) =>
            setBarangay(event.target.value)
          }
          placeholder="Enter barangay"
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

        <label
          htmlFor="collection-time"
          style={{
            display: "block",
            fontWeight: "600",
            marginBottom: "8px",
          }}
        >
          Collection Date and Time
        </label>

        <input
          id="collection-time"
          type="datetime-local"
          value={collectionTime}
          onChange={(event) =>
            setCollectionTime(event.target.value)
          }
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

        <label
          htmlFor="truck-id"
          style={{
            display: "block",
            fontWeight: "600",
            marginBottom: "8px",
          }}
        >
          Truck ID
        </label>

        <input
          id="truck-id"
          type="text"
          value={truckId}
          onChange={(event) =>
            setTruckId(event.target.value)
          }
          placeholder="Example: TRUCK-001"
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxSizing: "border-box",
          }}
        />

        <label
          htmlFor="driver-id"
          style={{
            display: "block",
            fontWeight: "600",
            marginBottom: "8px",
          }}
        >
          Driver ID
        </label>

        <input
          id="driver-id"
          type="text"
          value={driverId}
          onChange={(event) =>
            setDriverId(event.target.value)
          }
          placeholder="Example: DRIVER-001"
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxSizing: "border-box",
          }}
        />

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
            : "Create Collection Schedule"}
        </button>
      </form>

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