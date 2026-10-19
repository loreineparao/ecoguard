"use client";

import { useState } from "react";
import { getPermitDocuments } from "@/app/actions/view-permit-documents";

type PermitDocument = {
  id: string;
  application_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  content_type: string;
  uploaded_at: string;
  signed_url: string | null;
  url_error?: string;
};

type PermitDocumentViewerProps = {
  applicationId: string;
};

export default function PermitDocumentViewer({
  applicationId,
}: PermitDocumentViewerProps) {
  const [documents, setDocuments] = useState<PermitDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  async function handleViewDocuments() {
    setLoading(true);
    setError("");

    const result = await getPermitDocuments(applicationId);

    if (!result.success) {
      setError(
        result.error ?? "Unable to load permit documents."
      );
      setLoading(false);
      return;
    }

    setDocuments(result.documents);
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
        Submitted Documents
      </h3>

      {!loaded && (
        <button
          type="button"
          onClick={handleViewDocuments}
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
          {loading ? "Loading..." : "View Documents"}
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

      {loaded && documents.length === 0 && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "#f3f4f6",
            color: "#555",
            borderRadius: "8px",
          }}
        >
          No documents were uploaded for this application.
        </div>
      )}

      {documents.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: "15px",
            marginTop: "15px",
          }}
        >
          {documents.map((document) => (
            <div
              key={document.id}
              style={{
                padding: "15px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                background: "#fafafa",
              }}
            >
              <p>
                <strong>File:</strong>{" "}
                {document.file_name}
              </p>

              <p
                style={{
                  marginTop: "6px",
                  fontSize: "13px",
                  color: "#666",
                }}
              >
                <strong>Type:</strong>{" "}
                {document.content_type}
              </p>

              <p
                style={{
                  marginTop: "6px",
                  fontSize: "13px",
                  color: "#666",
                }}
              >
                <strong>Uploaded:</strong>{" "}
                {new Date(
                  document.uploaded_at
                ).toLocaleString()}
              </p>

              {document.signed_url && (
                <a
                  href={document.signed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "12px",
                    padding: "10px 14px",
                    background: "#2563eb",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                  }}
                >
                  Open Document
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}