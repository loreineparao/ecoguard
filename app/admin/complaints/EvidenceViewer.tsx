"use client";

import { useState } from "react";
import { getComplaintEvidence } from "@/app/actions/view-complaint-evidence";

type EvidenceItem = {
  id: string;
  complaint_id: string;
  file_url: string;
  uploaded_at: string;
  signedUrl: string | null;
};

type EvidenceViewerProps = {
  complaintId: string;
};

export default function EvidenceViewer({
  complaintId,
}: EvidenceViewerProps) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  async function handleViewEvidence() {
    setLoading(true);
    setError("");

    const result = await getComplaintEvidence(complaintId);

    if (!result.success) {
      setError(
        result.error ?? "Unable to load complaint evidence."
      );
      setLoading(false);
      return;
    }

    setEvidence(result.evidence ?? []);
    setLoaded(true);
    setLoading(false);
  }

  return (
    <div
      style={{
        marginTop: "20px",
        paddingTop: "20px",
        borderTop: "1px solid #eee",
      }}
    >
      <h3 style={{ marginBottom: "12px" }}>
        Supporting Evidence
      </h3>

      {!loaded && (
        <button
          type="button"
          onClick={handleViewEvidence}
          disabled={loading}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            background: loading ? "#999" : "#166534",
            color: "white",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading..." : "View Evidence"}
        </button>
      )}

      {error && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      {loaded && evidence.length === 0 && (
        <div
          style={{
            padding: "12px",
            background: "#f3f4f6",
            color: "#555",
            borderRadius: "8px",
          }}
        >
          No supporting evidence was uploaded for this complaint.
        </div>
      )}

      {evidence.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "15px",
            marginTop: "15px",
          }}
        >
          {evidence.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
                background: "#fafafa",
              }}
            >
              {item.signedUrl ? (
                <img
                  src={item.signedUrl}
                  alt="Complaint supporting evidence"
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                    borderRadius: "6px",
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "220px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#e5e7eb",
                    borderRadius: "6px",
                    color: "#666",
                  }}
                >
                  Unable to load image
                </div>
              )}

              <p
                style={{
                  marginTop: "10px",
                  fontSize: "13px",
                  color: "#666",
                }}
              >
                Uploaded:{" "}
                {new Date(item.uploaded_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}