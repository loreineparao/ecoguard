"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LocateFixed,
  LoaderCircle,
  Upload,
  MessageSquare,
} from "lucide-react";
import { createComplaint } from "@/app/actions/complaints";
import { uploadEvidence } from "@/app/actions/evidence";
import {
  getAddressFromCoordinates,
  saveComplaintLocation,
} from "@/app/actions/locations";
import ResidentFrame from "@/components/resident-frame";
import Link from "next/link";

export default function NewComplaintPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleGetLocation() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const nextLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        setLocation(nextLocation);
        setLocationAddress("");
        try {
          const result = await getAddressFromCoordinates(
            coords.latitude,
            coords.longitude
          );
          if (result.success && typeof result.address === "string") {
            setLocationAddress(result.address);
          } else {
            setLocationError(
              "Location captured, but the address name could not be resolved."
            );
          }
        } catch {
          setLocationError(
            "Location captured, but the address lookup failed."
          );
        } finally {
          setLocationLoading(false);
        }
      },
      (geoError) => {
        setLocationError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission was denied. Please allow location access in your browser."
            : geoError.code === geoError.POSITION_UNAVAILABLE
              ? "Your current location is unavailable."
              : "Getting your location took too long. Please try again."
        );
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!description.trim()) {
      setError("Please describe the environmental incident.");
      return;
    }

    setLoading(true);
    const result = await createComplaint("Illegal Dumping", description.trim());
    if (!result.success || !result.complaint?.id) {
      setLoading(false);
      setError(
        result.error ??
          "Complaint was created, but no complaint ID was returned."
      );
      return;
    }

    if (evidenceFile) {
      const uploadResult = await uploadEvidence(
        result.complaint.id,
        evidenceFile
      );
      if (!uploadResult.success) {
        setLoading(false);
        setError(
          `Complaint was created, but the photo could not be uploaded. ${uploadResult.error ?? ""}`
        );
        return;
      }
    }

    if (location) {
      const locationResult = await saveComplaintLocation(
        result.complaint.id,
        location.latitude,
        location.longitude,
        locationAddress || null
      );
      if (!locationResult.success) {
        setLoading(false);
        setError(
          `Complaint was created, but its location could not be saved. ${locationResult.error ?? "Please try again."}`
        );
        return;
      }
    }

    setLoading(false);
    setMessage(
      evidenceFile
        ? "Illegal dumping complaint and supporting photo submitted successfully."
        : "Illegal dumping complaint submitted successfully."
    );
    setDescription("");
    setEvidenceFile(null);
    setTimeout(() => router.push("/complaints"), 1500);
  }

  return (
    <ResidentFrame>
      <div className="form-page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">RESIDENT PORTAL • MABINI</p>
            <h1 className="page-title">Submit a Complaint</h1>
            <p className="page-subtitle">
              Help protect Mabini’s environment by reporting illegal dumping.
            </p>
          </div>
          <div className="page-header-actions">
            <Link className="button secondary" href="/dashboard">
              <ArrowLeft size={16} aria-hidden="true" /> Back to Dashboard
            </Link>
          </div>
        </div>

        <section className="card form-card">
          <div className="form-intro">
            <div className="form-icon">
              <MessageSquare size={22} aria-hidden="true" />
            </div>
            <div>
              <h2>Report Environmental Concern</h2>
              <p className="hint">
                Required fields are marked with <strong>*</strong>. Your report
                is securely routed to the MENR Office.
              </p>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-field full">
              <label htmlFor="category">Complaint category</label>
              <input id="category" value="Illegal Dumping" readOnly />
            </div>

            <div className="form-field full">
              <label htmlFor="description">
                Incident description <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what occurred, waste types observed, and any other relevant details."
                rows={6}
                disabled={loading}
                required
              />
              <p className="hint">
                Do not include unnecessary personal identity information.
              </p>
            </div>

            <div className="form-field full">
              <label>Incident location (Geo-tag)</label>
              <p className="hint">
                Attach exact GPS coordinates to help MENR inspectors find the
                site quickly.
              </p>
              <button
                className="button secondary gps-capture-btn"
                type="button"
                onClick={handleGetLocation}
                disabled={loading || locationLoading}
              >
                {locationLoading ? (
                  <LoaderCircle className="spin" size={16} aria-hidden="true" />
                ) : (
                  <LocateFixed size={16} aria-hidden="true" />
                )}
                {locationLoading
                  ? "Capturing location..."
                  : location
                    ? "Refresh GPS location"
                    : "Capture my GPS location"}
              </button>
              {location && (
                <p
                  className="hint form-confirmation"
                  style={{ color: "var(--primary-green)", marginTop: "6px" }}
                >
                  ✓ GPS Coordinates: {location.latitude.toFixed(5)},{" "}
                  {location.longitude.toFixed(5)}
                  {locationAddress ? ` (${locationAddress})` : ""}
                </p>
              )}
              {locationError && (
                <p
                  className="notice error"
                  style={{ margin: "6px 0 0" }}
                  role="alert"
                >
                  {locationError}
                </p>
              )}
            </div>

            <div className="form-field full">
              <label htmlFor="evidence">Supporting photo evidence</label>
              <input
                id="evidence"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={loading}
                onChange={(event) =>
                  setEvidenceFile(event.target.files?.[0] ?? null)
                }
              />
              <p className="hint">
                <Upload size={13} aria-hidden="true" /> Optional. JPG, PNG, or
                WEBP up to 5 MB.
              </p>
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
              <Link
                className={`button secondary ${loading ? "disabled" : ""}`}
                href="/dashboard"
                aria-disabled={loading}
                tabIndex={loading ? -1 : undefined}
                style={loading ? { pointerEvents: "none", opacity: 0.6 } : undefined}
              >
                Cancel
              </Link>
              <button className="button green" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderCircle className="spin" size={16} aria-hidden="true" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Complaint</span>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </ResidentFrame>
  );
}
