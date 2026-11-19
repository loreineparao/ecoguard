"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { uploadAvatar, removeAvatar } from "@/app/actions/profile";
import {
  Camera,
  Trash2,
  Check,
  AlertCircle,
  LoaderCircle,
  User,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

type ProfileAvatarEditorProps = {
  currentAvatarUrl?: string | null;
  userName: string;
};

export default function ProfileAvatarEditor({
  currentAvatarUrl,
  userName,
}: ProfileAvatarEditorProps) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EG";

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setSuccess("");
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size (max 2 MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("Image must be smaller than 2 MB. Please select a smaller photo.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError("Only JPG, JPEG, PNG, or WEBP images are supported.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setZoomLevel(1);
    setIsCropModalOpen(true);
  }

  function handleCancelPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsCropModalOpen(false);
    setZoomLevel(1);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSaveAvatar() {
    if (!selectedFile) return;
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("avatar", selectedFile);

    startTransition(async () => {
      const res = await uploadAvatar(formData);
      if (!res.success) {
        setError(res.error || "Failed to upload avatar.");
        return;
      }

      const finalUrl = res.avatarUrl || previewUrl;
      setAvatarUrl(finalUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      setIsCropModalOpen(false);
      setSuccess("Profile picture updated successfully.");

      // Synchronize cached avatar in localStorage
      if (typeof window !== "undefined" && finalUrl) {
        try {
          localStorage.setItem("ecoguard_cached_avatar", finalUrl);
        } catch {
          // ignore
        }
      }

      // Dispatch global event for instant header/dropdown sync without full reload
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ecoguard:avatar-updated", {
            detail: { avatarUrl: finalUrl },
          })
        );
      }

      router.refresh();
    });
  }

  async function handleRemoveAvatar() {
    if (!avatarUrl && !previewUrl) return;
    setError("");
    setSuccess("");

    startTransition(async () => {
      const res = await removeAvatar();
      if (!res.success) {
        setError(res.error || "Failed to remove avatar.");
        return;
      }

      setAvatarUrl(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setSuccess("Profile picture removed. Default avatar restored.");

      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("ecoguard_cached_avatar");
        } catch {
          // ignore
        }
      }

      // Dispatch global event for instant header/dropdown sync without full reload
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ecoguard:avatar-updated", {
            detail: { avatarUrl: null },
          })
        );
      }

      router.refresh();
    });
  }

  return (
    <div className="tiktok-avatar-section">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="sr-only"
        id="tiktok-avatar-file-input"
        disabled={isPending}
      />

      {/* Centered Large Circular Avatar with Camera Badge */}
      <div className="tiktok-avatar-center">
        <div
          className="tiktok-avatar-ring"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Change profile photo"
          title="Click to change profile photo"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${userName}'s profile photo`}
              width={112}
              height={112}
              className="tiktok-avatar-img"
              unoptimized
            />
          ) : (
            <div className="tiktok-avatar-fallback">
              {initials ? initials : <User size={48} aria-hidden="true" />}
            </div>
          )}

          {/* Camera Icon Overlay Badge */}
          <div className="tiktok-camera-badge" aria-hidden="true">
            <Camera size={16} />
          </div>

          {isPending && (
            <div className="tiktok-avatar-loading">
              <LoaderCircle className="spin" size={26} />
            </div>
          )}
        </div>

        {/* Change Photo Action Text */}
        <div className="tiktok-avatar-actions">
          <button
            type="button"
            className="tiktok-change-photo-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            <Camera size={14} aria-hidden="true" />
            <span>Change photo</span>
          </button>

          {avatarUrl && (
            <button
              type="button"
              className="tiktok-remove-photo-btn"
              onClick={handleRemoveAvatar}
              disabled={isPending}
              title="Remove photo and restore default initials"
            >
              <Trash2 size={13} aria-hidden="true" />
              <span>Remove photo</span>
            </button>
          )}
        </div>

        <p className="tiktok-avatar-note">
          JPG, PNG, or WEBP up to 2 MB. Circular crop is automatically applied.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="notice error sm" role="alert" style={{ marginTop: "12px", width: "100%" }}>
          <AlertCircle size={14} style={{ display: "inline-block", marginRight: "6px" }} />
          {error}
        </div>
      )}

      {success && (
        <div className="notice success sm" role="status" style={{ marginTop: "12px", width: "100%" }}>
          <Check size={14} style={{ display: "inline-block", marginRight: "6px" }} />
          {success}
        </div>
      )}

      {/* Interactive Crop & Zoom Preview Modal */}
      {isCropModalOpen && previewUrl && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crop-modal-title"
        >
          <div className="modal-card tiktok-crop-modal">
            <div className="tiktok-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} style={{ color: "var(--primary-green)" }} />
                <h3 id="crop-modal-title">Preview &amp; Adjust Photo</h3>
              </div>
              <span className="hint" style={{ fontSize: "12px" }}>
                Zoom and position your photo before saving
              </span>
            </div>

            {/* Circular Preview Viewport */}
            <div className="tiktok-preview-viewport-wrapper">
              <div className="tiktok-preview-circular-frame">
                <div
                  className="tiktok-preview-inner"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transition: "transform 0.1s ease-out",
                  }}
                >
                  <Image
                    src={previewUrl}
                    alt="Uploaded photo preview"
                    width={220}
                    height={220}
                    className="tiktok-preview-image"
                    unoptimized
                  />
                </div>
              </div>
              <div className="tiktok-preview-guideline">
                <span>Crop Viewport</span>
              </div>
            </div>

            {/* Zoom Slider Control */}
            <div className="tiktok-zoom-controls">
              <button
                type="button"
                className="tiktok-zoom-btn"
                onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.2))}
                aria-label="Zoom out"
                disabled={zoomLevel <= 1}
              >
                <ZoomOut size={16} />
              </button>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="tiktok-zoom-slider"
                aria-label="Zoom level"
              />
              <button
                type="button"
                className="tiktok-zoom-btn"
                onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.2))}
                aria-label="Zoom in"
                disabled={zoomLevel >= 2.5}
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                className="tiktok-zoom-btn"
                onClick={() => setZoomLevel(1)}
                title="Reset zoom"
                aria-label="Reset zoom"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Actions */}
            <div className="tiktok-modal-actions">
              <button
                type="button"
                className="button secondary sm"
                onClick={handleCancelPreview}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button green sm"
                onClick={handleSaveAvatar}
                disabled={isPending}
              >
                {isPending ? (
                  <LoaderCircle className="spin" size={14} aria-hidden="true" />
                ) : (
                  <Check size={14} aria-hidden="true" />
                )}
                {isPending ? "Saving..." : "Save Photo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
