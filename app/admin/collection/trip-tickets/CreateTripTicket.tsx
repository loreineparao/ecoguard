"use client";

import { useState } from "react";
import { createTripTicket } from "@/app/actions/trip-tickets";
import { LoaderCircle, Truck } from "lucide-react";

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
  const [driverError, setDriverError] = useState("");
  const [plateError, setPlateError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setError("");
    setDriverError("");
    setPlateError("");

    let hasValidationError = false;
    const cleanDriver = driverName.trim();
    const cleanPlate = plateNumber.trim();

    if (!scheduleId) {
      setError("Please select a collection schedule.");
      hasValidationError = true;
    }

    if (!cleanDriver) {
      setDriverError("Driver full name is required and cannot be blank.");
      hasValidationError = true;
    }

    if (!cleanPlate) {
      setPlateError("Vehicle plate number is required and cannot be blank.");
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    setLoading(true);

    const result = await createTripTicket(
      scheduleId,
      estimatedLoad.trim(),
      actualCollectionTime,
      cleanDriver,
      cleanPlate
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
    <section className="card" style={{ marginBottom: "28px" }}>
      <div className="card-title">
        <div>
          <h2>Record New Trip Ticket</h2>
          <p className="hint">Log waste collection trip, actual hauling load, and driver dispatch.</p>
        </div>
        <Truck size={20} color="var(--primary-green)" aria-hidden="true" />
      </div>

      {schedules.length === 0 ? (
        <p className="notice error">
          No collection schedules are available. Please create a collection schedule first.
        </p>
      ) : (
        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <div className="form-field full">
            <label htmlFor="schedule">
              Linked Collection Schedule <span aria-hidden="true">*</span>
            </label>
            <select
              id="schedule"
              value={scheduleId}
              onChange={(event) =>
                setScheduleId(event.target.value)
              }
              disabled={loading}
              required
            >
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.barangay} —{" "}
                  {new Date(schedule.collection_time).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="driver-name">
              Driver Full Name <span aria-hidden="true">*</span>
            </label>
            <input
              id="driver-name"
              type="text"
              value={driverName}
              onChange={(event) => {
                setDriverName(event.target.value);
                if (driverError) setDriverError("");
              }}
              placeholder="e.g. Juan Perez"
              required
              aria-invalid={Boolean(driverError)}
              style={driverError ? { borderColor: "#DC2626" } : undefined}
            />
            {driverError && (
              <p className="field-error-text" role="alert">
                {driverError}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="plate-number">
              Vehicle Plate Number <span aria-hidden="true">*</span>
            </label>
            <input
              id="plate-number"
              type="text"
              value={plateNumber}
              onChange={(event) => {
                setPlateNumber(event.target.value);
                if (plateError) setPlateError("");
              }}
              placeholder="e.g. ABC-1234"
              required
              aria-invalid={Boolean(plateError)}
              style={plateError ? { borderColor: "#DC2626" } : undefined}
            />
            {plateError && (
              <p className="field-error-text" role="alert">
                {plateError}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="estimated-load">Estimated Load (e.g. 5 tons)</label>
            <input
              id="estimated-load"
              type="text"
              value={estimatedLoad}
              onChange={(event) =>
                setEstimatedLoad(event.target.value)
              }
              placeholder="e.g. 4.5 tons"
            />
          </div>

          <div className="form-field">
            <label htmlFor="actual-collection-time">
              Actual Collection Time
            </label>
            <input
              id="actual-collection-time"
              type="datetime-local"
              value={actualCollectionTime}
              onChange={(event) =>
                setActualCollectionTime(event.target.value)
              }
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
              {loading ? "Recording Ticket..." : "Record Trip Ticket"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
