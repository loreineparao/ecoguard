"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createComplaint } from "@/app/actions/complaints";
import { uploadEvidence } from "@/app/actions/evidence";
import {
  saveComplaintLocation,
  getAddressFromCoordinates,
} from "@/app/actions/locations";

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
      setLocationError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocation({ latitude, longitude });
        setLocationAddress("");
        setLocationError("");

        try {
          const result = await getAddressFromCoordinates(
            latitude,
            longitude
          );

          
if (
  result.success &&
  typeof result.address === "string"
) {
  setLocationAddress(result.address);
} else {
  setLocationError(
    "error" in result
      ? result.error ??
        "Location captured, but the address could not be detected."
      : "Location captured, but the address could not be detected."
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
        let errorMessage =
          "Unable to get your location. Please try again.";

        if (geoError.code === geoError.PERMISSION_DENIED) {
          errorMessage =
            "Location permission was denied. Please allow location access in your browser.";
        } else if (
          geoError.code === geoError.POSITION_UNAVAILABLE
        ) {
          errorMessage =
            "Your current location is unavailable.";
        } else if (geoError.code === geoError.TIMEOUT) {
          errorMessage =
            "Getting your location took too long. Please try again.";
        }

        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!description.trim()) {
      setError("Please describe the illegal dumping incident.");
      return;
    }

    setLoading(true);

    // 1. Create the complaint first
    const result = await createComplaint(
      "Illegal Dumping",
      description.trim()
    );

    if (!result.success) {
      setLoading(false);
      setError(result.error ?? "Unable to submit the complaint.");
      return;
    }

    // 2. Get the newly created complaint ID
    const complaintId = result.complaint?.id;

    if (!complaintId) {
      setLoading(false);
      setError("Complaint was created, but no complaint ID was returned.");
      return;
    }

    // 3. Upload evidence if the resident selected a photo
    if (evidenceFile) {
      const evidenceResult = await uploadEvidence(
        complaintId,
        evidenceFile
      );

      if (!evidenceResult.success) {
        setLoading(false);
        setError(
          `Complaint was created, but the photo could not be uploaded. ${
            evidenceResult.error ?? ""
          }`
        );
        return;
      }
    }

    // 3. Save the complaint location if one was captured
    if (location) {
      const locationResult = await saveComplaintLocation(
  complaintId,
  location.latitude,
  location.longitude,
  locationAddress || null
);

      if (!locationResult.success) {
        console.error(
          "Complaint location save failed:",
          locationResult.error
        );

        setError(
          `Complaint was created, but its location could not be saved. ${
            locationResult.error ?? "Please try again."
          }`
        );

        setLoading(false);
        return;
      }
    }

    // 4. Everything succeeded
    setLoading(false);

    setMessage(
      evidenceFile
        ? "Illegal dumping complaint and supporting photo submitted successfully."
        : "Illegal dumping complaint submitted successfully."
    );

    setDescription("");
    setEvidenceFile(null);

    setTimeout(() => {
      router.push("/complaints");
    }, 1500);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#939393",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "grey",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          Illegal Dumping Complaint
        </h1>

        <p
          style={{
            color: "#2c2c2c",
            lineHeight: "1.6",
            marginBottom: "25px",
          }}
        >
          Submit an environmental complaint about illegal
          dumping. Please provide a clear description of the
          incident and, if available, supporting photographic
          evidence.
        </p>

        <form onSubmit={handleSubmit}>
          {/* CATEGORY */}

          <label
            htmlFor="category"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Complaint Category
          </label>

          <input
            id="category"
            type="text"
            value="Illegal Dumping"
            disabled
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              background: "#f3f4f6",
              boxSizing: "border-box",
              marginBottom: "20px",
            }}
          />

          {/* DESCRIPTION */}

          <label
            htmlFor="description"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Description
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Describe what happened, such as where the illegal dumping occurred and what you observed."
            rows={7}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              resize: "vertical",
              fontSize: "15px",
              boxSizing: "border-box",
            }}
          />

          <p
            style={{
              fontSize: "13px",
              color: "#777",
              marginTop: "8px",
              lineHeight: "1.5",
            }}
          >
            Do not include sensitive information that is not
            required for this description. Your account
            information is handled separately by EcoGuard.
          </p>

{/* LOCATION */}

<div style={{ marginTop: "20px" }}>
  <label
    style={{
      display: "block",
      fontWeight: "600",
      marginBottom: "8px",
    }}
  >
    Complaint Location
  </label>

  <p
    style={{
      fontSize: "13px",
      color: "#555",
      marginBottom: "10px",
      lineHeight: "1.5",
    }}
  >
    Capture the location where the illegal dumping occurred.
    Your browser will ask for permission to access your location.
  </p>

  <button
    type="button"
    onClick={handleGetLocation}
    disabled={loading || locationLoading}
    style={{
      width: "100%",
      padding: "12px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      background: "#fff",
      color: "#333",
      cursor:
        loading || locationLoading
          ? "not-allowed"
          : "pointer",
    }}
  >
    {locationLoading
      ? "Getting location..."
      : location
        ? "Refresh My Location"
        : "Get My Location"}
  </button>

  {location && (
    <p
      style={{
        marginTop: "10px",
        color: "#166534",
        fontSize: "13px",
      }}
    >
      Location captured successfully.
      <br />
      Latitude: {location.latitude.toFixed(6)}
      <br />
      Longitude: {location.longitude.toFixed(6)}
      {locationAddress && (
        <>
          <br />
          Address: {locationAddress}
        </>
      )}
    </p>
  )}

  {locationError && (
    <p
      style={{
        marginTop: "10px",
        color: "#991b1b",
        fontSize: "13px",
      }}
    >
      {locationError}
    </p>
  )}
</div>

          {/* EVIDENCE */}

          <label
            htmlFor="evidence"
            style={{
              display: "block",
              fontWeight: "600",
              marginTop: "20px",
              marginBottom: "8px",
            }}
          >
            Supporting Photo
          </label>

          <input
            id="evidence"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={loading}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setEvidenceFile(file);
            }}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              boxSizing: "border-box",
              background: "#fff",
            }}
          />

          <p
            style={{
              fontSize: "13px",
              color: "#777",
              marginTop: "8px",
              lineHeight: "1.5",
            }}
          >
            Optional. Only JPG, PNG, and WEBP images up to 5 MB
            are allowed.
          </p>

          {/* ERROR */}

          {error && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: "8px",
              }}
            >
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {message && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                background: "#dcfce7",
                color: "#166534",
                borderRadius: "8px",
              }}
            >
              {message}
            </div>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "14px",
              border: "none",
              borderRadius: "8px",
              background: loading ? "#999" : "#16a34a",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Submitting..."
              : "Submit Illegal Dumping Complaint"}
          </button>

          {/* CANCEL */}

          <button
            type="button"
            onClick={() => router.push("/complaints")}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              background: "white",
              color: "#333",
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    </main>
  );
}