"use client";

import { useState } from "react";
import { createCollectionSchedule } from "@/app/actions/collection-schedules";
import { CalendarPlus, LoaderCircle } from "lucide-react";

export default function CreateCollectionSchedule() {
  const [barangay, setBarangay] = useState("");
  const [collectionTime, setCollectionTime] = useState("");
  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [barangayError, setBarangayError] = useState("");
  const [timeError, setTimeError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setError("");
    setBarangayError("");
    setTimeError("");

    let hasValidationError = false;
    const cleanBarangay = barangay.trim();

    if (!cleanBarangay) {
      setBarangayError("Barangay / Area is required and cannot be blank.");
      hasValidationError = true;
    }

    if (!collectionTime) {
      setTimeError("Collection Date and Time is required.");
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    setLoading(true);

    const result = await createCollectionSchedule(
      cleanBarangay,
      collectionTime,
      truckId.trim(),
      driverId.trim()
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
    <section className="card" style={{ marginBottom: "28px" }}>
      <div className="card-title">
        <div>
          <h2>Create New Waste Collection Schedule</h2>
          <p className="hint">Schedule waste pick-up times and assign trucks for Mabini barangays.</p>
        </div>
        <CalendarPlus size={20} color="var(--primary-green)" aria-hidden="true" />
      </div>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="barangay">
            Barangay / Area <span aria-hidden="true">*</span>
          </label>
          <input
            id="barangay"
            type="text"
            value={barangay}
            onChange={(event) => {
              setBarangay(event.target.value);
              if (barangayError) setBarangayError("");
            }}
            placeholder="e.g. Poblacion, Anilao, Mainaga"
            required
            aria-invalid={Boolean(barangayError)}
            style={barangayError ? { borderColor: "#DC2626" } : undefined}
          />
          {barangayError && (
            <p className="field-error-text" role="alert">
              {barangayError}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="collection-time">
            Collection Date and Time <span aria-hidden="true">*</span>
          </label>
          <input
            id="collection-time"
            type="datetime-local"
            value={collectionTime}
            onChange={(event) => {
              setCollectionTime(event.target.value);
              if (timeError) setTimeError("");
            }}
            required
            aria-invalid={Boolean(timeError)}
            style={timeError ? { borderColor: "#DC2626" } : undefined}
          />
          {timeError && (
            <p className="field-error-text" role="alert">
              {timeError}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="truck-id">Truck Identifier</label>
          <input
            id="truck-id"
            type="text"
            value={truckId}
            onChange={(event) =>
              setTruckId(event.target.value)
            }
            placeholder="e.g. TRUCK-001"
          />
        </div>

        <div className="form-field">
          <label htmlFor="driver-id">Assigned Driver ID / Name</label>
          <input
            id="driver-id"
            type="text"
            value={driverId}
            onChange={(event) =>
              setDriverId(event.target.value)
            }
            placeholder="e.g. DRIVER-001"
          />
        </div>

        {error && (
          <div className="notice error full" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="notice success full" role="status">
            {message}
          </div>
        )}

        <div className="form-actions full">
          <button
            type="submit"
            className="button green"
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle className="spin" size={16} aria-hidden="true" />
            ) : null}
            {loading ? "Creating Schedule..." : "Create Collection Schedule"}
          </button>
        </div>
      </form>
    </section>
  );
}
