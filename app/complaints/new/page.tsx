"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  LocateFixed,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { submitFullComplaint } from "@/app/actions/complaints";
import { getAddressFromCoordinates } from "@/app/actions/locations";
import ResidentFrame from "@/components/resident-frame";
import Link from "next/link";

type GeoStatus =
  | "idle"
  | "detecting"
  | "captured"
  | "permission_denied"
  | "unavailable"
  | "timeout"
  | "unsupported";

export default function NewComplaintPage() {
  const router = useRouter();

  // Form input states
  const [description, setDescription] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  // Geolocation states
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [locationError, setLocationError] = useState("");
  const hasAutoRequestedRef = useRef(false);

  // Submission & workflow states
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [locationFieldError, setLocationFieldError] = useState("");
  const [evidenceError, setEvidenceError] = useState("");

  // Synchronous submission lock and retry ID tracking
  const isSubmittingRef = useRef(false);
  const activeComplaintIdRef = useRef<string | null>(null);

  // Automatic geolocation capture on mount (runs once)
  useEffect(() => {
    if (hasAutoRequestedRef.current) return;
    hasAutoRequestedRef.current = true;
    requestGeolocation(false);
  }, []);

  function requestGeolocation(isManualRetry: boolean) {
    setLocationError("");

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      setLocationError("Geolocation is not supported by your browser or device.");
      return;
    }

    setGeoStatus("detecting");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = position.coords;
        const captured = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

        setLocation(captured);
        setGeoStatus("captured");
        setLocationError("");

        // Attempt reverse geocoding in background
        try {
          const res = await getAddressFromCoordinates(
            coords.latitude,
            coords.longitude
          );
          if (res.success && typeof res.address === "string") {
            setLocationAddress(res.address);
          }
        } catch {
          // Non-blocking reverse geocode failure
        }
      },
      (geoErr) => {
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setGeoStatus("permission_denied");
          setLocationError(
            "Location permission was denied. Tap 'Retry GPS Location' or provide an address/landmark below."
          );
        } else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) {
          setGeoStatus("unavailable");
          setLocationError(
            "Your current GPS location is unavailable. Tap 'Retry GPS Location' or enter landmark below."
          );
        } else if (geoErr.code === geoErr.TIMEOUT) {
          setGeoStatus("timeout");
          setLocationError(
            "Location request timed out. Tap 'Retry GPS Location' to try again."
          );
        } else {
          setGeoStatus("unavailable");
          setLocationError("Unable to acquire location coordinates.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: isManualRetry ? 15000 : 12000,
        maximumAge: 30000, // Reuse 30-sec cached position for fast mobile Safari performance
      }
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Guard against double clicks and concurrent submissions
    if (isSubmittingRef.current) return;

    setMessage("");
    setError("");
    setDescriptionError("");
    setLocationFieldError("");
    setEvidenceError("");

    let hasValidationError = false;
    let firstErrorField: string | null = null;

    // 1. Description validation: cannot be blank or contain only spaces
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setDescriptionError("Please describe the environmental incident.");
      hasValidationError = true;
      if (!firstErrorField) firstErrorField = "description";
    }

    // 2. Incident location validation: GPS coordinates or manual address required
    const hasCoordinates =
      location !== null &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude);
    const hasManualAddress = manualAddress.trim().length > 0;
    const hasResolvedAddress = locationAddress.trim().length > 0;

    if (!hasCoordinates && !hasManualAddress && !hasResolvedAddress) {
      setLocationFieldError(
        "Incident location is required. Please capture your GPS coordinates or enter a landmark/address."
      );
      hasValidationError = true;
      if (!firstErrorField) firstErrorField = "manualAddress";
    }

    // 3. Supporting photo evidence validation: REQUIRED
    if (!evidenceFile && !activeComplaintIdRef.current) {
      setEvidenceError(
        "Please upload photographic evidence of the environmental concern."
      );
      hasValidationError = true;
      if (!firstErrorField) firstErrorField = "evidence";
    } else if (evidenceFile) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(evidenceFile.type.toLowerCase())) {
        setEvidenceError(
          "Please upload an image in JPG, JPEG, PNG, or WEBP format."
        );
        hasValidationError = true;
        if (!firstErrorField) firstErrorField = "evidence";
      } else if (evidenceFile.size > 5 * 1024 * 1024) {
        setEvidenceError("Photo evidence must be 5 MB or smaller.");
        hasValidationError = true;
        if (!firstErrorField) firstErrorField = "evidence";
      }
    }

    if (hasValidationError) {
      setError("Please complete all required fields and upload photographic evidence.");
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setProgressText("Submitting complaint to MENR Office...");

    try {
      // Build FormData payload for atomic submission
      const formData = new FormData();
      formData.append("category", "Illegal Dumping");
      formData.append("description", trimmedDesc);

      // Pass existing complaint ID if retrying a partial failure
      if (activeComplaintIdRef.current) {
        formData.append("complaintId", activeComplaintIdRef.current);
      }

      if (location) {
        formData.append("latitude", location.latitude.toString());
        formData.append("longitude", location.longitude.toString());
        const finalAddress = locationAddress || manualAddress.trim();
        if (finalAddress) {
          formData.append("address", finalAddress);
        }
      } else if (manualAddress.trim()) {
        formData.append("address", manualAddress.trim());
      }

      if (evidenceFile) {
        setProgressText("Uploading supporting photo evidence...");
        formData.append("evidence", evidenceFile);
      }

      const result = await submitFullComplaint(formData);

      if (!result.success) {
        // Track complaint ID if created before evidence failure
        if (result.complaintId) {
          activeComplaintIdRef.current = result.complaintId;
        }
        setError(result.error);
        setProgressText("");
        return;
      }

      // Complete success
      const finalId = result.complaintId;
      setProgressText("");
      setMessage(
        evidenceFile
          ? `Illegal dumping complaint #${finalId.slice(0, 8)} and photo submitted successfully.`
          : `Illegal dumping complaint #${finalId.slice(0, 8)} submitted successfully.`
      );

      // Reset form fields
      setDescription("");
      setEvidenceFile(null);
      activeComplaintIdRef.current = null;

      // Navigate cleanly
      setTimeout(() => {
        router.push("/complaints");
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected network error occurred.";
      setError(`Submission encountered an issue: ${errMsg}. Please retry.`);
      setProgressText("");
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
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
            <Link className="button secondary" href="/complaints">
              <ArrowLeft size={16} aria-hidden="true" /> Back to My Complaints
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

          <form className="form-grid" onSubmit={handleSubmit} noValidate>
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
                onChange={(event) => {
                  setDescription(event.target.value);
                  if (descriptionError) setDescriptionError("");
                }}
                placeholder="Describe what occurred, waste types observed, and any other relevant details."
                rows={6}
                disabled={loading}
                required
                aria-invalid={Boolean(descriptionError)}
                aria-describedby={descriptionError ? "description-error" : undefined}
                style={descriptionError ? { borderColor: "#DC2626" } : undefined}
              />
              {descriptionError && (
                <p id="description-error" className="field-error-text" role="alert">
                  {descriptionError}
                </p>
              )}
              <p className="hint">
                Do not include unnecessary personal identity information.
              </p>
            </div>

            {/* Geolocation Section */}
            <div className="form-field full">
              <label>
                Incident location (GPS Geo-tag or Landmark) <span aria-hidden="true">*</span>
              </label>
              <p className="hint">
                Coordinates help MENR inspectors find and assess the site accurately.
              </p>

              <div
                style={{
                  background: "#F8FAFC",
                  border: locationFieldError ? "1px solid #DC2626" : "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  marginTop: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {geoStatus === "detecting" ? (
                      <LoaderCircle className="spin" size={16} color="var(--primary-green)" aria-hidden="true" />
                    ) : geoStatus === "captured" ? (
                      <CheckCircle2 size={16} color="var(--primary-green)" aria-hidden="true" />
                    ) : geoStatus === "timeout" ? (
                      <Clock size={16} color="#D97706" aria-hidden="true" />
                    ) : (
                      <ShieldAlert size={16} color="#DC2626" aria-hidden="true" />
                    )}

                    <strong style={{ fontSize: "13.5px", color: "var(--dark-forest)" }}>
                      {geoStatus === "detecting"
                        ? "Detecting location..."
                        : geoStatus === "captured"
                          ? "Location captured"
                          : geoStatus === "permission_denied"
                            ? "Location permission denied"
                            : geoStatus === "timeout"
                              ? "Location request timed out"
                              : geoStatus === "unsupported"
                                ? "Geolocation unsupported"
                                : "Location capture"}
                    </strong>
                  </div>

                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => requestGeolocation(true)}
                    disabled={loading || geoStatus === "detecting"}
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                  >
                    {geoStatus === "detecting" ? (
                      <>
                        <LoaderCircle className="spin" size={13} aria-hidden="true" /> Detecting...
                      </>
                    ) : geoStatus === "captured" ? (
                      <>
                        <RefreshCw size={13} aria-hidden="true" /> Re-check GPS
                      </>
                    ) : (
                      <>
                        <LocateFixed size={13} aria-hidden="true" /> Retry GPS Location
                      </>
                    )}
                  </button>
                </div>

                {/* Location Details */}
                {location && (
                  <div
                    style={{
                      fontSize: "12.5px",
                      color: "var(--dark-forest)",
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      marginTop: "6px",
                    }}
                  >
                    <div>
                      <strong>GPS:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </div>
                    {locationAddress && (
                      <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                        <strong>Resolved Address:</strong> {locationAddress}
                      </div>
                    )}
                  </div>
                )}

                {locationError && (
                  <p
                    className="notice error"
                    style={{ margin: "8px 0 0", fontSize: "12px" }}
                    role="alert"
                  >
                    {locationError}
                  </p>
                )}

                {/* Manual Address Fallback */}
                <div style={{ marginTop: "12px" }}>
                  <label
                    htmlFor="manualAddress"
                    style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}
                  >
                    Manual Barangay / Landmark Fallback {location ? "(Optional)" : "(Required if GPS is unavailable)"}
                  </label>
                  <input
                    id="manualAddress"
                    type="text"
                    value={manualAddress}
                    onChange={(e) => {
                      setManualAddress(e.target.value);
                      if (locationFieldError) setLocationFieldError("");
                    }}
                    placeholder="e.g., Near Barangay Hall, Anilao East, Mabini"
                    disabled={loading}
                    aria-invalid={Boolean(locationFieldError)}
                    style={{
                      fontSize: "13px",
                      padding: "8px 12px",
                      width: "100%",
                      borderColor: locationFieldError ? "#DC2626" : undefined,
                    }}
                  />
                  {locationFieldError && (
                    <p className="field-error-text" role="alert" style={{ marginTop: "6px" }}>
                      {locationFieldError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Evidence */}
            <div className="form-field full">
              <label htmlFor="evidence">
                Supporting photographic evidence <span aria-hidden="true">*</span>
              </label>
              <input
                id="evidence"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                disabled={loading}
                aria-invalid={Boolean(evidenceError)}
                aria-describedby={evidenceError ? "evidence-error" : undefined}
                style={evidenceError ? { borderColor: "#DC2626" } : undefined}
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  if (!selected) {
                    setEvidenceFile(null);
                    setEvidenceError("Please upload photographic evidence of the environmental concern.");
                    return;
                  }

                  const allowedTypes = [
                    "image/jpeg",
                    "image/jpg",
                    "image/png",
                    "image/webp",
                  ];
                  if (!allowedTypes.includes(selected.type.toLowerCase())) {
                    setEvidenceError("Please upload an image in JPG, JPEG, PNG, or WEBP format.");
                    setEvidenceFile(null);
                    event.target.value = "";
                    return;
                  }

                  if (selected.size > 5 * 1024 * 1024) {
                    setEvidenceError("Photo evidence must be 5 MB or smaller.");
                    setEvidenceFile(null);
                    event.target.value = "";
                    return;
                  }

                  setEvidenceFile(selected);
                  setEvidenceError("");
                }}
              />
              {evidenceError && (
                <p id="evidence-error" className="field-error-text" role="alert">
                  {evidenceError}
                </p>
              )}
              <p className="hint">
                <Upload size={13} aria-hidden="true" /> Required. JPG, JPEG, PNG, or WEBP up to 5 MB.
              </p>
            </div>

            {error && (
              <div className="notice error full" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {progressText && (
              <div className="notice progress full" role="status">
                <LoaderCircle className="spin" size={16} aria-hidden="true" />
                <span>{progressText}</span>
              </div>
            )}

            {message && (
              <div className="notice success full" role="status">
                <CheckCircle2 size={16} aria-hidden="true" />
                <span>{message}</span>
              </div>
            )}

            <div className="form-actions full">
              <Link
                className={`button secondary ${loading ? "disabled" : ""}`}
                href="/complaints"
                aria-disabled={loading}
                tabIndex={loading ? -1 : undefined}
                style={loading ? { pointerEvents: "none", opacity: 0.6 } : undefined}
              >
                Cancel
              </Link>
              <button
                className="button green"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle className="spin" size={16} aria-hidden="true" />
                    <span>Submitting...</span>
                  </>
                ) : activeComplaintIdRef.current ? (
                  <span>Retry Submission</span>
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
