"use client";

import { useState } from "react";
import { createReport } from "@/app/actions/reports";

export default function CreateReport() {
  const [reportType, setReportType] = useState(
    "Environmental Complaints Report"
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setMessage("");
    setError("");

    const result = await createReport(reportType);

    if (!result.success) {
      setError(
        result.error ?? "Unable to generate report."
      );
      setLoading(false);
      return;
    }

    setMessage("Report generated successfully.");

    setLoading(false);

    window.location.reload();
  }

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        background: "#f9fafb",
      }}
    >
      <h2 style={{ marginBottom: "15px" }}>
        Generate Report
      </h2>

      <label
        htmlFor="report-type"
        style={{
          display: "block",
          fontWeight: "600",
          marginBottom: "8px",
        }}
      >
        Report Type
      </label>

      <select
        id="report-type"
        value={reportType}
        onChange={(event) =>
          setReportType(event.target.value)
        }
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "15px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          background: "white",
        }}
      >
        <option value="Environmental Complaints Report">
          Environmental Complaints Report
        </option>

        <option value="Garbage Collection Report">
          Garbage Collection Report
        </option>
      </select>

      <button
        type="button"
        onClick={handleGenerate}
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
          ? "Generating..."
          : "Generate Report"}
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