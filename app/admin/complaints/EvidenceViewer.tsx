"use client";

import { useState } from "react";
import { getComplaintEvidence } from "@/app/actions/view-complaint-evidence";
import { ImageIcon, LoaderCircle } from "lucide-react";

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
        marginTop: "16px",
        paddingTop: "16px",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <h3 style={{ color: "var(--dark-forest)", fontSize: "14px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          <ImageIcon size={16} aria-hidden="true" /> Photographic Evidence
        </h3>

        {!loaded && (
          <button
            type="button"
            className="button secondary"
            onClick={handleViewEvidence}
            disabled={loading}
            style={{ padding: "6px 14px", fontSize: "12px" }}
          >
            {loading ? (
              <LoaderCircle className="spin" size={14} aria-hidden="true" />
            ) : null}
            {loading ? "Loading Evidence..." : "View Attached Evidence"}
          </button>
        )}
      </div>

      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}

      {loaded && evidence.length === 0 && (
        <p className="hint">No photographic evidence was uploaded with this complaint.</p>
      )}

      {evidence.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginTop: "12px",
          }}
        >
          {evidence.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "10px",
                background: "#F8FAFC",
              }}
            >
              {item.signedUrl ? (
                <a
                  href={item.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Click to view full image"
                >
                  <img
                    src={item.signedUrl}
                    alt="Complaint supporting evidence"
                    style={{
                      width: "100%",
                      height: "180px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                    }}
                  />
                </a>
              ) : (
                <div
                  style={{
                    height: "180px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#E2E8F0",
                    borderRadius: "8px",
                    color: "var(--text-secondary)",
                    fontSize: "12px",
                  }}
                >
                  Unable to load image
                </div>
              )}

              <p
                style={{
                  marginTop: "8px",
                  fontSize: "11.5px",
                  color: "var(--text-secondary)",
                }}
              >
                Uploaded: {new Date(item.uploaded_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
