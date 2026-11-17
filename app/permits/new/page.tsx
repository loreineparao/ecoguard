"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Eye,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  TreePine,
  Upload,
  X,
} from "lucide-react";
import { submitPermitApplication } from "@/app/actions/permits";
import { uploadPermitDocument } from "@/app/actions/permit-documents";
import ResidentFrame from "@/components/resident-frame";
import Link from "next/link";

const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per file

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type SingleDocUploadCardProps = {
  number: number;
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled: boolean;
  onPreview: (file: File) => void;
};

function SingleDocUploadCard({
  number,
  id,
  title,
  description,
  icon,
  file,
  onFileSelect,
  disabled,
  onPreview,
}: SingleDocUploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileError, setFileError] = useState("");

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (!ALLOWED_DOC_TYPES.includes(selected.type)) {
      setFileError(
        "Unsupported file format. Please upload a PDF, JPG, PNG, or WEBP file."
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File is too large. Maximum file size allowed is 5 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    onFileSelect(selected);
  }

  function handleRemove() {
    onFileSelect(null);
    setFileError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleTriggerPicker() {
    inputRef.current?.click();
  }

  return (
    <div className={`doc-upload-card ${file ? "has-file" : ""} ${fileError ? "is-error" : ""}`}>
      <div className="doc-upload-header">
        <div className={`doc-upload-icon-box ${file ? "has-file" : ""}`}>
          {icon}
        </div>

        <div className="doc-upload-details">
          <div className="doc-upload-title-row">
            <h4 className="doc-upload-title">
              {number}. {title}
            </h4>
            <span className="doc-required-badge">Required</span>
          </div>
          <p className="doc-upload-desc">{description}</p>
          <span className="doc-upload-formats">
            Accepted: PDF, JPG, JPEG, PNG (Max 5 MB)
          </span>
        </div>

        <div className="doc-upload-status">
          {file ? (
            <span className="doc-status-badge uploaded">
              <CheckCircle2 size={13} aria-hidden="true" /> Ready to Submit
            </span>
          ) : (
            <span className="doc-status-badge empty">Not Uploaded</span>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        disabled={disabled}
        onChange={handleChange}
      />

      <div className="doc-upload-footer">
        {file ? (
          <div className="doc-selected-box">
            <div className="doc-file-info">
              <span className="doc-file-icon">
                <FileText size={18} aria-hidden="true" />
              </span>
              <div className="doc-file-text">
                <span className="doc-file-name" title={file.name}>
                  {file.name}
                </span>
                <span className="doc-file-size">
                  {formatFileSize(file.size)} · {file.type || "Document"}
                </span>
              </div>
            </div>

            <div className="doc-file-actions">
              <button
                type="button"
                className="doc-action-btn"
                onClick={() => onPreview(file)}
                title="Preview document"
              >
                <Eye size={13} aria-hidden="true" /> Preview
              </button>
              <button
                type="button"
                className="doc-action-btn"
                onClick={handleTriggerPicker}
                disabled={disabled}
                title="Replace selected file"
              >
                <RefreshCw size={13} aria-hidden="true" /> Replace
              </button>
              <button
                type="button"
                className="doc-action-btn danger"
                onClick={handleRemove}
                disabled={disabled}
                title="Remove selected file"
              >
                <Trash2 size={13} aria-hidden="true" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="doc-empty-box">
            <button
              type="button"
              className="doc-picker-btn"
              onClick={handleTriggerPicker}
              disabled={disabled}
            >
              <Upload size={15} aria-hidden="true" /> Choose File to Upload
            </button>
          </div>
        )}

        {fileError && <p className="doc-error-text" role="alert">{fileError}</p>}
      </div>
    </div>
  );
}

type TreePhotosUploadCardProps = {
  number: number;
  id: string;
  title: string;
  description: string;
  photos: File[];
  onAddPhotos: (newPhotos: File[]) => void;
  onRemovePhoto: (index: number) => void;
  disabled: boolean;
  onPreviewPhoto: (file: File) => void;
};

function TreePhotosUploadCard({
  number,
  id,
  title,
  description,
  photos,
  onAddPhotos,
  onRemovePhoto,
  disabled,
  onPreviewPhoto,
}: TreePhotosUploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [photoError, setPhotoError] = useState("");

  // Create preview URLs with useMemo and clean them up
  const previews = useMemo(() => {
    return photos.map((file) => URL.createObjectURL(file));
  }, [photos]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError("");
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" has an unsupported format (only JPG and PNG are accepted).`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}" exceeds 5 MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length > 0) {
      setPhotoError(errors.join(" "));
    }

    if (validFiles.length > 0) {
      onAddPhotos(validFiles);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleTriggerPicker() {
    inputRef.current?.click();
  }

  return (
    <div className={`doc-upload-card ${photos.length > 0 ? "has-file" : ""} ${photoError ? "is-error" : ""}`}>
      <div className="doc-upload-header">
        <div className={`doc-upload-icon-box ${photos.length > 0 ? "has-file" : ""}`}>
          <Camera size={20} aria-hidden="true" />
        </div>

        <div className="doc-upload-details">
          <div className="doc-upload-title-row">
            <h4 className="doc-upload-title">
              {number}. {title}
            </h4>
            <span className="doc-required-badge">Required</span>
          </div>
          <p className="doc-upload-desc">{description}</p>
          <span className="doc-upload-formats">
            Accepted: JPG, JPEG, PNG (Max 5 MB each · Multiple photos supported)
          </span>
        </div>

        <div className="doc-upload-status">
          {photos.length > 0 ? (
            <span className="doc-status-badge uploaded">
              <CheckCircle2 size={13} aria-hidden="true" /> {photos.length} {photos.length === 1 ? "Photo Ready" : "Photos Ready"}
            </span>
          ) : (
            <span className="doc-status-badge empty">Not Uploaded</span>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        disabled={disabled}
        onChange={handleFileChange}
      />

      <div className="doc-upload-footer">
        {photos.length > 0 ? (
          <div>
            <div className="photos-grid">
              {photos.map((photo, index) => {
                const previewSrc = previews[index];

                return (
                  <div key={`${photo.name}-${index}`} className="photo-grid-item">
                    <div
                      className="photo-thumb-wrap"
                      onClick={() => onPreviewPhoto(photo)}
                      title="Click to view full preview"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onPreviewPhoto(photo);
                        }
                      }}
                    >
                      {previewSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewSrc}
                          alt={`Tree photo ${index + 1}`}
                          className="photo-thumb-img"
                        />
                      ) : (
                        <div className="photo-thumb-placeholder">
                          <ImageIcon size={24} aria-hidden="true" />
                        </div>
                      )}
                      <div className="photo-thumb-overlay">
                        <Eye size={16} aria-hidden="true" />
                      </div>
                    </div>

                    <div className="photo-info-bar">
                      <div className="photo-meta">
                        <span className="photo-name" title={photo.name}>
                          {photo.name}
                        </span>
                        <span className="photo-size">
                          {formatFileSize(photo.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="photo-remove-btn"
                        onClick={() => onRemovePhoto(index)}
                        disabled={disabled}
                        title={`Remove ${photo.name}`}
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <Trash2 size={12} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="photos-actions-row">
              <button
                type="button"
                className="doc-action-btn"
                onClick={handleTriggerPicker}
                disabled={disabled}
              >
                <Plus size={13} aria-hidden="true" /> Add More Photos
              </button>
              <span className="hint" style={{ fontSize: "12px" }}>
                Total: {photos.length} tree {photos.length === 1 ? "photo" : "photos"} selected
              </span>
            </div>
          </div>
        ) : (
          <div className="doc-empty-box">
            <button
              type="button"
              className="doc-picker-btn"
              onClick={handleTriggerPicker}
              disabled={disabled}
            >
              <Camera size={15} aria-hidden="true" /> Choose Tree Photos
            </button>
          </div>
        )}

        {photoError && <p className="doc-error-text" role="alert">{photoError}</p>}
      </div>
    </div>
  );
}

export default function NewPermitPage() {
  const [applicantName, setApplicantName] = useState("");

  // Five required document states
  const [landTitleFile, setLandTitleFile] = useState<File | null>(null);
  const [applicationLetterFile, setApplicationLetterFile] = useState<File | null>(null);
  const [barangayClearanceFile, setBarangayClearanceFile] = useState<File | null>(null);
  const [noObjectionFile, setNoObjectionFile] = useState<File | null>(null);
  const [treePhotos, setTreePhotos] = useState<File[]>([]);

  // Preview modal state
  const [previewItem, setPreviewItem] = useState<{
    file: File;
    url: string;
    isImage: boolean;
  } | null>(null);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [message, setMessage] = useState("");
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handlePreviewFile(file: File) {
    const isImage = file.type.startsWith("image/");
    const url = URL.createObjectURL(file);

    if (isImage) {
      setPreviewItem({ file, url, isImage: true });
    } else {
      // For PDF or other documents, open in a new browser tab for rich native inspection
      window.open(url, "_blank");
    }
  }

  function closePreview() {
    if (previewItem?.url) {
      URL.revokeObjectURL(previewItem.url);
    }
    setPreviewItem(null);
  }

  function handleAddTreePhotos(newFiles: File[]) {
    setTreePhotos((prev) => [...prev, ...newFiles]);
  }

  function handleRemoveTreePhoto(indexToRemove: number) {
    setTreePhotos((prev) => prev.filter((_, i) => i !== indexToRemove));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!applicantName.trim()) {
      setError("Please enter your applicant full name.");
      return;
    }

    // Validation: All 5 required documents must be uploaded
    const missingDocs: string[] = [];
    if (!landTitleFile) {
      missingDocs.push("1. Land Title / Proof of Land Ownership");
    }
    if (!applicationLetterFile) {
      missingDocs.push("2. Formal Application Letter");
    }
    if (!barangayClearanceFile) {
      missingDocs.push("3. Barangay Environmental Clearance");
    }
    if (!noObjectionFile) {
      missingDocs.push("4. Resolution Interposing No Objection");
    }
    if (treePhotos.length === 0) {
      missingDocs.push("5. Photos of the Trees (at least one photo required)");
    }

    if (missingDocs.length > 0) {
      setError(
        `Please upload all required supporting documents before submitting:\n• ${missingDocs.join(
          "\n• "
        )}`
      );
      return;
    }

    setLoading(true);

    try {
      const totalUploads = 4 + treePhotos.length;
      let currentUpload = 0;

      // 1. Create the permit application with documentary requirements
      setProgressText("Submitting permit application record to MENR Office...");
      const result = await submitPermitApplication(applicantName.trim(), {
        land_title: "submitted",
        application_letter: "submitted",
        barangay_clearance: "submitted",
        resolution_no_objection: "submitted",
        no_objection: "submitted",
        tree_photos: `${treePhotos.length} photo(s) submitted`,
      });

      if (!result.success || !result.application?.id) {
        throw new Error(
          result.error ??
            "Application could not be created. Please try again."
        );
      }

      const appId = result.application.id;

      // 2. Upload Land Title
      currentUpload++;
      setProgressText(
        `Uploading Land Title / Proof of Ownership (${currentUpload}/${totalUploads})...`
      );
      const titleRes = await uploadPermitDocument(
        appId,
        landTitleFile as File,
        "Land Title / Proof of Land Ownership"
      );
      if (!titleRes.success) {
        throw new Error(`Land Title upload failed: ${titleRes.error}`);
      }

      // 3. Upload Application Letter
      currentUpload++;
      setProgressText(
        `Uploading Application Letter (${currentUpload}/${totalUploads})...`
      );
      const letterRes = await uploadPermitDocument(
        appId,
        applicationLetterFile as File,
        "Application Letter"
      );
      if (!letterRes.success) {
        throw new Error(`Application Letter upload failed: ${letterRes.error}`);
      }

      // 4. Upload Barangay Clearance
      currentUpload++;
      setProgressText(
        `Uploading Barangay Clearance (${currentUpload}/${totalUploads})...`
      );
      const brgyRes = await uploadPermitDocument(
        appId,
        barangayClearanceFile as File,
        "Barangay Clearance"
      );
      if (!brgyRes.success) {
        throw new Error(`Barangay Clearance upload failed: ${brgyRes.error}`);
      }

      // 5. Upload Resolution Interposing No Objection
      currentUpload++;
      setProgressText(
        `Uploading Resolution Interposing No Objection (${currentUpload}/${totalUploads})...`
      );
      const noObjRes = await uploadPermitDocument(
        appId,
        noObjectionFile as File,
        "Resolution Interposing No Objection"
      );
      if (!noObjRes.success) {
        throw new Error(
          `Resolution Interposing No Objection upload failed: ${noObjRes.error}`
        );
      }

      // 6. Upload Tree Photos
      for (let i = 0; i < treePhotos.length; i++) {
        currentUpload++;
        setProgressText(
          `Uploading Tree Photo ${i + 1} of ${treePhotos.length} (${currentUpload}/${totalUploads})...`
        );
        const photoRes = await uploadPermitDocument(
          appId,
          treePhotos[i],
          `Photos of the Trees (${i + 1} of ${treePhotos.length})`
        );
        if (!photoRes.success) {
          throw new Error(
            `Tree Photo ${i + 1} upload failed: ${photoRes.error}`
          );
        }
      }

      // Full submission successful
      setProgressText("");
      setSubmittedAppId(appId);
      setMessage(
        "Your Tree Cutting Permit Application and all supporting documents have been successfully filed with the MENR Office Mabini."
      );
    } catch (err: unknown) {
      setProgressText("");
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(
        `Submission encountered an issue: ${errorMessage} Your selected files have been preserved so you can retry.`
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setApplicantName("");
    setLandTitleFile(null);
    setApplicationLetterFile(null);
    setBarangayClearanceFile(null);
    setNoObjectionFile(null);
    setTreePhotos([]);
    setMessage("");
    setError("");
    setSubmittedAppId(null);
  }

  return (
    <ResidentFrame>
      <div className="page-header">
        <div>
          <p className="eyebrow">RESIDENT SERVICES • MABINI</p>
          <h1 className="page-title">Tree Cutting Permit Application</h1>
          <p className="page-subtitle">
            Submit documentary requirements to the Municipal Environment & Natural Resources (MENR) Office.
          </p>
        </div>
        <div className="page-header-actions">
          <Link className="button secondary" href="/permits">
            <ArrowLeft size={16} aria-hidden="true" /> Back to My Applications
          </Link>
        </div>
      </div>

      <div className="form-card-container">
        {message ? (
          <div className="card" style={{ padding: "32px 28px", textAlign: "center" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#E8F5E9",
                color: "#2E7D32",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CheckCircle2 size={32} aria-hidden="true" />
            </div>

            <h2 style={{ color: "var(--dark-forest)", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>
              Application Successfully Submitted!
            </h2>

            <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "540px", margin: "0 auto 14px", lineHeight: 1.5 }}>
              {message}
            </p>

            {submittedAppId && (
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "12.5px",
                  background: "#F1F5F9",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  display: "inline-block",
                  color: "#334155",
                  marginBottom: "24px",
                }}
              >
                Reference Application ID: <strong>{submittedAppId}</strong>
              </p>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="button green" href="/permits">
                <FileCheck2 size={16} aria-hidden="true" /> View My Applications
              </Link>
              <button
                type="button"
                className="button secondary"
                onClick={handleReset}
              >
                Submit Another Application
              </button>
            </div>
          </div>
        ) : (
          <form className="card" onSubmit={handleSubmit}>
            <div className="card-title">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="activity-icon permit">
                  <TreePine size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2>Permit Application Form</h2>
                  <span className="hint">
                    MENR Municipal Environmental Clearance Compliance
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="notice error" role="alert" style={{ whiteSpace: "pre-line" }}>
                <AlertCircle size={16} aria-hidden="true" />
                <div>{error}</div>
              </div>
            )}

            {progressText && (
              <div className="notice progress" role="status">
                <LoaderCircle className="spin" size={16} aria-hidden="true" />
                <span>{progressText}</span>
              </div>
            )}

            <div className="form-field" style={{ marginTop: "12px" }}>
              <label htmlFor="applicantName">
                Applicant Full Name <span aria-hidden="true" style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                id="applicantName"
                type="text"
                placeholder="e.g., Juan Dela Cruz"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                disabled={loading}
                required
              />
              <span className="hint">
                Provide your legal name matching your government-issued ID and property documents.
              </span>
            </div>

            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
              <div className="requirements-section-header">
                <h3 className="requirements-section-title">
                  Required Documentary Submissions
                </h3>
                <p className="requirements-section-desc">
                  Please provide the five official documents required by the MENR Office under municipal environmental regulations.
                </p>
              </div>

              <div className="doc-cards-list">
                {/* 1. Land Title / Proof of Ownership */}
                <SingleDocUploadCard
                  number={1}
                  id="land-title-upload"
                  title="Land Title / Proof of Land Ownership"
                  description="Upload a certified true copy of the land title, tax declaration, or deed of sale verifying property ownership."
                  icon={<FileCheck2 size={20} aria-hidden="true" />}
                  file={landTitleFile}
                  onFileSelect={setLandTitleFile}
                  disabled={loading}
                  onPreview={handlePreviewFile}
                />

                {/* 2. Formal Application Letter */}
                <SingleDocUploadCard
                  number={2}
                  id="application-letter-upload"
                  title="Application Letter"
                  description="Formal letter addressed to the Municipal Environment & Natural Resources Officer stating reasons for tree cutting (e.g., public safety, hazard, construction)."
                  icon={<FileText size={20} aria-hidden="true" />}
                  file={applicationLetterFile}
                  onFileSelect={setApplicationLetterFile}
                  disabled={loading}
                  onPreview={handlePreviewFile}
                />

                {/* 3. Barangay Clearance */}
                <SingleDocUploadCard
                  number={3}
                  id="barangay-clearance-upload"
                  title="Barangay Clearance"
                  description="Environmental clearance or barangay resolution issued by the Punong Barangay where the subject tree is located."
                  icon={<ShieldCheck size={20} aria-hidden="true" />}
                  file={barangayClearanceFile}
                  onFileSelect={setBarangayClearanceFile}
                  disabled={loading}
                  onPreview={handlePreviewFile}
                />

                {/* 4. Resolution Interposing No Objection */}
                <SingleDocUploadCard
                  number={4}
                  id="resolution-no-objection-upload"
                  title="Resolution Interposing No Objection"
                  description="Upload a copy of the Resolution Interposing No Objection issued by the appropriate barangay or authorized local government office, as required by the MENR Office."
                  icon={<FileCheck2 size={20} aria-hidden="true" />}
                  file={noObjectionFile}
                  onFileSelect={setNoObjectionFile}
                  disabled={loading}
                  onPreview={handlePreviewFile}
                />

                {/* 5. Photos of the Trees */}
                <TreePhotosUploadCard
                  number={5}
                  id="tree-photos-upload"
                  title="Photos of the Trees"
                  description="Clear photographs showing the full tree, trunk base, defect/hazard condition, and proximity to buildings, roads, or overhead power lines."
                  photos={treePhotos}
                  onAddPhotos={handleAddTreePhotos}
                  onRemovePhoto={handleRemoveTreePhoto}
                  disabled={loading}
                  onPreviewPhoto={handlePreviewFile}
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: "28px" }}>
              <Link className="button secondary" href="/permits">
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
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <TreePine size={16} aria-hidden="true" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Image Preview Lightbox Modal */}
      {previewItem && (
        <div
          className="preview-modal-overlay"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
          aria-label="Document Image Preview"
        >
          <div
            className="preview-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="preview-modal-header">
              <div className="preview-modal-title">
                <ImageIcon size={16} aria-hidden="true" />
                <span title={previewItem.file.name}>{previewItem.file.name}</span>
                <span className="hint">({formatFileSize(previewItem.file.size)})</span>
              </div>
              <button
                type="button"
                className="preview-modal-close"
                onClick={closePreview}
                aria-label="Close preview"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="preview-modal-body">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewItem.url}
                alt={previewItem.file.name}
                className="preview-modal-image"
              />
            </div>
          </div>
        </div>
      )}
    </ResidentFrame>
  );
}
