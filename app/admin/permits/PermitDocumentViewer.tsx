"use client";

import { useState } from "react";
import { getPermitDocuments } from "@/app/actions/view-permit-documents";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  ImageIcon,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

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
  requirements?: unknown;
};

function parseDocFileName(rawName: string): { category: string | null; fileName: string } {
  const match = rawName.match(/^\[(.*?)\]\s*(.*)$/);
  if (match) {
    return {
      category: match[1],
      fileName: match[2] || rawName,
    };
  }
  return {
    category: null,
    fileName: rawName,
  };
}

export default function PermitDocumentViewer({
  applicationId,
  requirements,
}: PermitDocumentViewerProps) {
  const [documents, setDocuments] = useState<PermitDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  async function handleLoadDocuments() {
    setLoading(true);
    setError("");

    const result = await getPermitDocuments(applicationId);

    if (!result.success) {
      setError(result.error ?? "Unable to load permit documents.");
      setLoading(false);
      return;
    }

    setDocuments(result.documents);
    setLoaded(true);
    setLoading(false);
  }

  // Categorize documents
  const landTitleDocs: PermitDocument[] = [];
  const appLetterDocs: PermitDocument[] = [];
  const brgyClearanceDocs: PermitDocument[] = [];
  const noObjectionDocs: PermitDocument[] = [];
  const treePhotosDocs: PermitDocument[] = [];
  const otherDocs: PermitDocument[] = [];

  for (const doc of documents) {
    const { category, fileName } = parseDocFileName(doc.file_name);
    const combined = `${category || ""} ${fileName}`.toLowerCase();

    if (
      category?.toLowerCase().includes("no objection") ||
      category?.toLowerCase().includes("interposing") ||
      combined.includes("no objection") ||
      combined.includes("interposing") ||
      combined.includes("resolution_no_objection") ||
      combined.includes("no_objection")
    ) {
      noObjectionDocs.push(doc);
    } else if (
      category?.toLowerCase().includes("land title") ||
      combined.includes("land_title") ||
      combined.includes("proof of ownership") ||
      combined.includes("land title")
    ) {
      landTitleDocs.push(doc);
    } else if (
      category?.toLowerCase().includes("application letter") ||
      combined.includes("application_letter") ||
      combined.includes("letter")
    ) {
      appLetterDocs.push(doc);
    } else if (
      category?.toLowerCase().includes("barangay") ||
      combined.includes("barangay_clearance") ||
      combined.includes("clearance")
    ) {
      brgyClearanceDocs.push(doc);
    } else if (
      category?.toLowerCase().includes("photo") ||
      combined.includes("tree photo") ||
      combined.includes("photos of the trees") ||
      combined.includes("tree_photos") ||
      (doc.content_type.startsWith("image/") && !combined.includes("id"))
    ) {
      treePhotosDocs.push(doc);
    } else {
      otherDocs.push(doc);
    }
  }

  // Detect whether this is a historical application submitted prior to adding the requirement
  const isLegacyApplication = Boolean(
    requirements &&
    typeof requirements === "object" &&
    !("no_objection" in (requirements as Record<string, unknown>)) &&
    !("resolution_no_objection" in (requirements as Record<string, unknown>)) &&
    !("resolution_interposing_no_objection" in (requirements as Record<string, unknown>))
  );

  // The 4 document clearances + tree photos
  const requiredCategories = [
    {
      key: "land_title",
      name: "Land Title / Proof of Land Ownership",
      docs: landTitleDocs,
      icon: <FileCheck2 size={16} aria-hidden="true" />,
      isLegacyOptional: false,
    },
    {
      key: "application_letter",
      name: "Application Letter",
      docs: appLetterDocs,
      icon: <FileText size={16} aria-hidden="true" />,
      isLegacyOptional: false,
    },
    {
      key: "barangay_clearance",
      name: "Barangay Clearance",
      docs: brgyClearanceDocs,
      icon: <ShieldCheck size={16} aria-hidden="true" />,
      isLegacyOptional: false,
    },
    {
      key: "no_objection",
      name: "Resolution Interposing No Objection",
      docs: noObjectionDocs,
      icon: <FileCheck2 size={16} aria-hidden="true" />,
      isLegacyOptional: isLegacyApplication,
    },
  ];

  return (
    <div
      style={{
        marginTop: "16px",
        paddingTop: "16px",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FileText size={16} color="var(--primary-green)" aria-hidden="true" />
          <h3
            style={{
              color: "var(--dark-forest)",
              fontSize: "14px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Uploaded Clearance Documents
          </h3>
          {loaded && (
            <span className="hint" style={{ fontSize: "11.5px" }}>
              ({documents.length} {documents.length === 1 ? "file verified in storage" : "files verified in storage"})
            </span>
          )}
        </div>

        <button
          type="button"
          className="button secondary"
          onClick={handleLoadDocuments}
          disabled={loading}
          style={{ padding: "6px 14px", fontSize: "12px" }}
        >
          {loading ? (
            <LoaderCircle className="spin" size={14} aria-hidden="true" />
          ) : loaded ? (
            <RefreshCw size={13} aria-hidden="true" />
          ) : (
            <FileText size={13} aria-hidden="true" />
          )}
          {loading
            ? "Verifying Storage..."
            : loaded
              ? "Re-check Storage"
              : "View Documents"}
        </button>
      </div>

      {error && (
        <div className="notice error" role="alert" style={{ marginBottom: "12px" }}>
          <AlertCircle size={15} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {loaded && (
        <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
          {/* Required Single Documents (Land Title, Application Letter, Barangay Clearance) */}
          {requiredCategories.map((cat) => {
            const hasFile = cat.docs.length > 0;
            const primaryDoc = cat.docs[0];
            const { fileName } = primaryDoc
              ? parseDocFileName(primaryDoc.file_name)
              : { fileName: "" };

            return (
              <div
                key={cat.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  border: "1px solid var(--border)",
                  borderRadius: "9px",
                  background: hasFile ? "#F8FAFC" : cat.isLegacyOptional ? "#F8FAFC" : "#FFF7ED",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: hasFile ? "var(--primary-green)" : cat.isLegacyOptional ? "#64748B" : "#D97706", display: "flex" }}>
                      {cat.icon}
                    </span>
                    <strong style={{ fontSize: "13.5px", color: "var(--dark-forest)" }}>
                      {cat.name}
                    </strong>
                    {hasFile ? (
                      <span className="badge resolved" style={{ fontSize: "11px", padding: "2px 8px" }}>
                        <CheckCircle2 size={11} aria-hidden="true" /> Submitted
                      </span>
                    ) : cat.isLegacyOptional ? (
                      <span className="badge pending" style={{ fontSize: "11px", padding: "2px 8px" }}>
                        Not Required (Legacy)
                      </span>
                    ) : (
                      <span className="badge rejected" style={{ fontSize: "11px", padding: "2px 8px", background: "#FEF2F2", color: "#DC2626", borderColor: "#FECACA" }}>
                        <ShieldAlert size={11} aria-hidden="true" /> Missing
                      </span>
                    )}
                  </div>

                  {hasFile ? (
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                        Filename: {fileName}
                      </span>
                      {" · "}
                      <span>{primaryDoc.content_type}</span>
                      {" · "}
                      <span>Uploaded {new Date(primaryDoc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  ) : cat.isLegacyOptional ? (
                    <span className="hint" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Application filed prior to the Resolution Interposing No Objection requirement.
                    </span>
                  ) : (
                    <span className="hint" style={{ fontSize: "12px", color: "#B45309" }}>
                      No file uploaded to Supabase Storage for this requirement.
                    </span>
                  )}
                </div>

                <div>
                  {hasFile && primaryDoc.signed_url ? (
                    <a
                      href={primaryDoc.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button secondary"
                      style={{ padding: "6px 12px", fontSize: "12px", whiteSpace: "nowrap" }}
                    >
                      <ExternalLink size={13} aria-hidden="true" /> View / Download
                    </a>
                  ) : (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        padding: "6px 12px",
                      }}
                    >
                      {hasFile ? "URL Expired" : "Not available"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* 4. Photos of the Trees */}
          <div
            style={{
              padding: "12px 14px",
              border: "1px solid var(--border)",
              borderRadius: "9px",
              background: treePhotosDocs.length > 0 ? "#F8FAFC" : "#FFF7ED",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: treePhotosDocs.length > 0 ? "10px" : "0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ color: treePhotosDocs.length > 0 ? "var(--primary-green)" : "#D97706", display: "flex" }}>
                  <Camera size={16} aria-hidden="true" />
                </span>
                <strong style={{ fontSize: "13.5px", color: "var(--dark-forest)" }}>
                  Photos of the Trees
                </strong>
                {treePhotosDocs.length > 0 ? (
                  <span className="badge resolved" style={{ fontSize: "11px", padding: "2px 8px" }}>
                    <CheckCircle2 size={11} aria-hidden="true" /> Submitted ({treePhotosDocs.length} {treePhotosDocs.length === 1 ? "photo" : "photos"})
                  </span>
                ) : (
                  <span className="badge rejected" style={{ fontSize: "11px", padding: "2px 8px", background: "#FEF2F2", color: "#DC2626", borderColor: "#FECACA" }}>
                    <ShieldAlert size={11} aria-hidden="true" /> Missing
                  </span>
                )}
              </div>

              {treePhotosDocs.length === 0 && (
                <span className="hint" style={{ fontSize: "12px", color: "#B45309" }}>
                  No tree photos uploaded to Supabase Storage.
                </span>
              )}
            </div>

            {treePhotosDocs.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "10px",
                  marginTop: "8px",
                }}
              >
                {treePhotosDocs.map((photoDoc, pIndex) => {
                  const { fileName } = parseDocFileName(photoDoc.file_name);

                  return (
                    <div
                      key={photoDoc.id}
                      style={{
                        background: "var(--white)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {photoDoc.signed_url ? (
                        <a
                          href={photoDoc.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "block",
                            width: "100%",
                            height: "100px",
                            borderRadius: "6px",
                            overflow: "hidden",
                            background: "#0F172A",
                          }}
                          title="Open photo full size"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photoDoc.signed_url}
                            alt={fileName}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </a>
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100px",
                            borderRadius: "6px",
                            background: "#F1F5F9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94A3B8",
                          }}
                        >
                          <ImageIcon size={24} aria-hidden="true" />
                        </div>
                      )}

                      <div style={{ minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 600,
                            color: "var(--dark-forest)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "block",
                          }}
                          title={fileName}
                        >
                          {pIndex + 1}. {fileName}
                        </span>
                        <span className="hint" style={{ fontSize: "10.5px" }}>
                          Uploaded {new Date(photoDoc.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>

                      {photoDoc.signed_url && (
                        <a
                          href={photoDoc.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button secondary"
                          style={{
                            padding: "4px 8px",
                            fontSize: "11.5px",
                            textAlign: "center",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                        >
                          <ExternalLink size={12} aria-hidden="true" /> View / Download
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Additional / Legacy Documents if any exist */}
          {otherDocs.length > 0 && (
            <div
              style={{
                marginTop: "6px",
                padding: "12px 14px",
                border: "1px dashed var(--border)",
                borderRadius: "9px",
                background: "#F8FAFC",
              }}
            >
              <strong
                style={{
                  fontSize: "12.5px",
                  color: "var(--dark-forest)",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Additional / Legacy Uploaded Documents ({otherDocs.length})
              </strong>
              <div style={{ display: "grid", gap: "8px" }}>
                {otherDocs.map((oDoc) => {
                  const { category, fileName } = parseDocFileName(oDoc.file_name);

                  return (
                    <div
                      key={oDoc.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        background: "var(--white)",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {category && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "1px 6px",
                                borderRadius: "4px",
                                background: "#E8F5E9",
                                color: "#1B5E20",
                              }}
                            >
                              {category}
                            </span>
                          )}
                          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-main)" }}>
                            {fileName}
                          </span>
                        </div>
                        <span className="hint" style={{ fontSize: "11px" }}>
                          {oDoc.content_type} · Uploaded {new Date(oDoc.uploaded_at).toLocaleString()}
                        </span>
                      </div>

                      {oDoc.signed_url && (
                        <a
                          href={oDoc.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button secondary"
                          style={{ padding: "4px 10px", fontSize: "11.5px" }}
                        >
                          <ExternalLink size={12} aria-hidden="true" /> View / Download
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
