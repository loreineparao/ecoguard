"use client";

import { useState } from "react";
import { createTripTicket } from "@/app/actions/trip-tickets";
import { CheckCircle2, LoaderCircle, Truck } from "lucide-react";
import { useRouter } from "next/navigation";

type Schedule = {
  id: string;
  barangay: string;
  collection_time: string;
  truck_id: string | null;
  driver_id: string | null;
};

type CreateTripTicketProps = {
  schedules?: Schedule[];
  onTicketCreated?: () => void;
};

export default function CreateTripTicket({
  onTicketCreated,
}: CreateTripTicketProps) {
  const router = useRouter();

  const [driverName, setDriverName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [estimatedLoad, setEstimatedLoad] = useState("");
  const [actualCollectionTime, setActualCollectionTime] = useState(() => {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [driverError, setDriverError] = useState("");
  const [plateError, setPlateError] = useState("");
  const [timeError, setTimeError] = useState("");
  const [loadError, setLoadError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setDriverError("");
    setPlateError("");
    setTimeError("");
    setLoadError("");

    let hasValidationError = false;
    const cleanDriver = driverName.trim();
    const cleanPlate = plateNumber.trim();
    const cleanTime = actualCollectionTime.trim();
    const cleanLoad = estimatedLoad.trim();

    // 1. Validate Driver Full Name (Required)
    if (!cleanDriver) {
      setDriverError("Driver full name is required and cannot be blank.");
      hasValidationError = true;
    }

    // 2. Validate Vehicle Plate Number (Required)
    if (!cleanPlate) {
      setPlateError("Vehicle plate number is required and cannot be blank.");
      hasValidationError = true;
    }

    // 3. Validate Actual Collection Time (Required for completed collection)
    if (!cleanTime) {
      setTimeError("Actual collection time is required to record a completed trip ticket.");
      hasValidationError = true;
    } else {
      const parsedTime = new Date(cleanTime);
      if (isNaN(parsedTime.getTime())) {
        setTimeError("Please enter a valid collection date and time.");
        hasValidationError = true;
      }
    }

    // 4. Validate Estimated Load (Nonnegative numeric validation)
    if (cleanLoad) {
      const match = cleanLoad.match(/^([0-9]+(?:\.[0-9]+)?)/);
      if (!match) {
        setLoadError("Estimated load must start with a valid non-negative number (e.g. 4.5 tons).");
        hasValidationError = true;
      } else {
        const val = parseFloat(match[1]);
        if (isNaN(val) || val < 0) {
          setLoadError("Estimated load cannot be negative.");
          hasValidationError = true;
        }
      }
    }

    if (hasValidationError) {
      return;
    }

    setLoading(true);

    const result = await createTripTicket(
      cleanDriver,
      cleanPlate,
      cleanTime,
      cleanLoad || undefined,
      null // No linked collection schedule required
    );

    if (!result.success) {
      setError(result.error ?? "Unable to create trip ticket.");
      setLoading(false);
      return;
    }

    setMessage("Completed trip ticket recorded successfully.");
    setDriverName("");
    setPlateNumber("");
    setEstimatedLoad("");
    setActualCollectionTime(
      new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    );
    setLoading(false);

    if (onTicketCreated) {
      onTicketCreated();
    } else {
      router.refresh();
    }
  }

  return (
    <section className="card" style={{ marginBottom: "28px" }}>
      <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <h2 style={{ margin: 0 }}>Record New Trip Ticket</h2>
            <span
              className="badge resolved"
              style={{ fontSize: "11px", padding: "2px 8px" }}
              title="Newly recorded trip tickets represent completed collections"
            >
              <CheckCircle2 size={11} aria-hidden="true" /> Completed Collection
            </span>
          </div>
          <p className="hint" style={{ margin: 0 }}>
            Log completed waste collection trip, verified hauling load, and driver dispatch directly without schedule linking.
          </p>
        </div>
        <Truck size={20} color="var(--primary-green)" aria-hidden="true" />
      </div>

      <form className="form-grid" onSubmit={handleSubmit} noValidate style={{ marginTop: "16px" }}>
        {/* Driver Full Name */}
        <div className="form-field">
          <label htmlFor="driver-name">
            Driver Full Name <span aria-hidden="true" style={{ color: "#DC2626" }}>*</span>
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
            disabled={loading}
            aria-invalid={Boolean(driverError)}
            style={driverError ? { borderColor: "#DC2626" } : undefined}
          />
          {driverError && (
            <p className="field-error-text" role="alert">
              {driverError}
            </p>
          )}
        </div>

        {/* Vehicle Plate Number */}
        <div className="form-field">
          <label htmlFor="plate-number">
            Vehicle Plate Number <span aria-hidden="true" style={{ color: "#DC2626" }}>*</span>
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
            disabled={loading}
            aria-invalid={Boolean(plateError)}
            style={plateError ? { borderColor: "#DC2626" } : undefined}
          />
          {plateError && (
            <p className="field-error-text" role="alert">
              {plateError}
            </p>
          )}
        </div>

        {/* Estimated Load */}
        <div className="form-field">
          <label htmlFor="estimated-load">
            Estimated Load <span className="hint" style={{ fontWeight: 400, textTransform: "none" }}>(e.g. 4.5 tons)</span>
          </label>
          <input
            id="estimated-load"
            type="text"
            value={estimatedLoad}
            onChange={(event) => {
              setEstimatedLoad(event.target.value);
              if (loadError) setLoadError("");
            }}
            placeholder="e.g. 4.5 tons"
            disabled={loading}
            aria-invalid={Boolean(loadError)}
            style={loadError ? { borderColor: "#DC2626" } : undefined}
          />
          {loadError && (
            <p className="field-error-text" role="alert">
              {loadError}
            </p>
          )}
        </div>

        {/* Actual Collection Time */}
        <div className="form-field">
          <label htmlFor="actual-collection-time">
            Actual Collection Time <span aria-hidden="true" style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            id="actual-collection-time"
            type="datetime-local"
            value={actualCollectionTime}
            onChange={(event) => {
              setActualCollectionTime(event.target.value);
              if (timeError) setTimeError("");
            }}
            required
            disabled={loading}
            aria-invalid={Boolean(timeError)}
            style={timeError ? { borderColor: "#DC2626" } : undefined}
          />
          {timeError && (
            <p className="field-error-text" role="alert">
              {timeError}
            </p>
          )}
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
            {loading ? "Recording Completed Ticket..." : "Record Completed Trip Ticket"}
          </button>
        </div>
      </form>
    </section>
  );
}
