"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { uploadAvatar, removeAvatar } from "@/app/actions/profile";
import { Camera, Trash2, Check, AlertCircle, LoaderCircle, User } from "lucide-react";
import { useRouter } from "next/navigation";

type AvatarUploadProps = {
  currentAvatarUrl?: string | null;
  userName: string;
};

export default function AvatarUpload({
  currentAvatarUrl,
  userName,
}: AvatarUploadProps) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      setError("Only JPG, PNG, or WEBP images are supported.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  function handleCancelPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
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
      setSuccess("Profile picture updated successfully.");

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

  const activeImage = previewUrl || avatarUrl;

  return (
    <div className="avatar-upload-container">
      <div className="avatar-preview-wrapper">
        <div className="avatar-frame">
          {activeImage ? (
            <Image
              src={activeImage}
              alt={`${userName}'s profile avatar`}
              width={88}
              height={88}
              className="avatar-img"
              unoptimized
            />
          ) : (
            <div className="avatar-fallback" aria-label="Default avatar">
              {initials ? initials : <User size={36} aria-hidden="true" />}
            </div>
          )}

          {isPending && (
            <div className="avatar-loading-overlay" aria-label="Uploading image">
              <LoaderCircle className="spin" size={24} />
            </div>
          )}
        </div>

        <div className="avatar-actions-column">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            id="avatar-file-input"
            disabled={isPending}
          />

          {!previewUrl ? (
            <div className="avatar-btn-row">
              <button
                type="button"
                className="button secondary sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
              >
                <Camera size={14} aria-hidden="true" />
                {avatarUrl ? "Change Photo" : "Upload Photo"}
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  className="button danger-outline sm"
                  onClick={handleRemoveAvatar}
                  disabled={isPending}
                  title="Remove current avatar"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
          ) : (
            <div className="avatar-btn-row">
              <button
                type="button"
                className="button green sm"
                onClick={handleSaveAvatar}
                disabled={isPending}
              >
                {isPending ? (
                  <LoaderCircle className="spin" size={14} />
                ) : (
                  <Check size={14} aria-hidden="true" />
                )}
                Save Photo
              </button>

              <button
                type="button"
                className="button secondary sm"
                onClick={handleCancelPreview}
                disabled={isPending}
              >
                Cancel
              </button>
            </div>
          )}

          <p className="avatar-hint">
            Allowed formats: JPG, PNG, or WEBP. Max size: 2 MB. Square images work best.
          </p>
        </div>
      </div>

      {error && (
        <div className="notice error sm" role="alert" style={{ marginTop: "10px" }}>
          <AlertCircle size={14} style={{ display: "inline-block", marginRight: "6px" }} />
          {error}
        </div>
      )}

      {success && (
        <div className="notice success sm" role="status" style={{ marginTop: "10px" }}>
          <Check size={14} style={{ display: "inline-block", marginRight: "6px" }} />
          {success}
        </div>
      )}
    </div>
  );
}
