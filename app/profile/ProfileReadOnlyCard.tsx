"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ActionMenu from "@/components/action-menu";
import {
  uploadAvatar,
  removeAvatar,
  updateUserProfileDetails,
} from "@/app/actions/profile";
import { validatePhoneNumber } from "@/lib/validators";
import { MABINI_BARANGAYS } from "@/lib/mabini-constants";
import {
  EllipsisVertical,
  Pencil,
  User,
  Lock,
  Camera,
  Trash2,
  Check,
  AlertCircle,
  LoaderCircle,
  X,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

type ProfileReadOnlyCardProps = {
  initialFullName: string;
  email: string;
  initialBarangay: string;
  initialAddress: string;
  initialContactNumber: string;
  initialAvatarUrl: string | null;
  userRole: string;
};

export default function ProfileReadOnlyCard({
  initialFullName,
  email,
  initialBarangay,
  initialAddress,
  initialContactNumber,
  initialAvatarUrl,
  userRole,
}: ProfileReadOnlyCardProps) {
  const router = useRouter();

  // Active Profile State (Read-Only View)
  const [fullName, setFullName] = useState(initialFullName);
  const [barangay, setBarangay] = useState(initialBarangay);
  const [address, setAddress] = useState(initialAddress);
  const [contactNumber, setContactNumber] = useState(initialContactNumber);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);

  const [prevProps, setPrevProps] = useState({
    initialFullName,
    initialBarangay,
    initialAddress,
    initialContactNumber,
    initialAvatarUrl,
  });

  if (
    prevProps.initialFullName !== initialFullName ||
    prevProps.initialBarangay !== initialBarangay ||
    prevProps.initialAddress !== initialAddress ||
    prevProps.initialContactNumber !== initialContactNumber ||
    prevProps.initialAvatarUrl !== initialAvatarUrl
  ) {
    setPrevProps({
      initialFullName,
      initialBarangay,
      initialAddress,
      initialContactNumber,
      initialAvatarUrl,
    });
    setFullName(initialFullName);
    setBarangay(initialBarangay);
    setAddress(initialAddress);
    setContactNumber(initialContactNumber);
    setAvatarUrl(initialAvatarUrl);
  }

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Form State
  const [editFullName, setEditFullName] = useState(fullName);
  const [editBarangay, setEditBarangay] = useState(barangay);
  const [editAddress, setEditAddress] = useState(address);
  const [editContactNumber, setEditContactNumber] = useState(contactNumber);

  // Photo Edit State
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(avatarUrl);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingRemoveAvatar, setPendingRemoveAvatar] = useState(false);
  const [photoError, setPhotoError] = useState("");

  // Validation & Processing
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive initials for avatar fallback
  const initials =
    (fullName || "Resident")
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EG";

  // Open Edit Mode
  function openEditModal() {
    setEditFullName(fullName);
    setEditBarangay(barangay);
    setEditAddress(address);
    setEditContactNumber(contactNumber);
    setPreviewAvatarUrl(avatarUrl);
    setPendingAvatarFile(null);
    setPendingRemoveAvatar(false);
    setPhotoError("");
    setFieldErrors({});
    setFormError("");
    setIsEditModalOpen(true);
  }

  // Cancel Edit Mode (Discards all unsaved changes)
  function handleCancel() {
    if (isSaving) return;
    if (previewAvatarUrl && previewAvatarUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewAvatarUrl);
    }
    setPendingAvatarFile(null);
    setPendingRemoveAvatar(false);
    setPreviewAvatarUrl(avatarUrl);
    setPhotoError("");
    setFieldErrors({});
    setFormError("");
    setIsEditModalOpen(false);
  }

  // Handle File Input Selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError("");
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2 MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setPhotoError("Image must be smaller than 2 MB. Please select a smaller photo.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate type (JPG, PNG, WEBP)
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setPhotoError("Only JPG, PNG, or WEBP images are supported.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Clean up previous blob URL if any
    if (previewAvatarUrl && previewAvatarUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewAvatarUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewAvatarUrl(objectUrl);
    setPendingAvatarFile(file);
    setPendingRemoveAvatar(false);
  }

  // Handle Remove Photo Action
  function handleRemovePhoto() {
    if (previewAvatarUrl && previewAvatarUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewAvatarUrl);
    }
    setPreviewAvatarUrl(null);
    setPendingAvatarFile(null);
    setPendingRemoveAvatar(true);
    setPhotoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Validate form inputs
  function validate() {
    const errors: Record<string, string> = {};

    if (!editFullName.trim()) {
      errors.fullName = "Full name is required and cannot be blank.";
    } else if (editFullName.trim().length > 120) {
      errors.fullName = "Full name must be 120 characters or fewer.";
    }

    if (editContactNumber.trim()) {
      const phoneValidation = validatePhoneNumber(editContactNumber.trim());
      if (!phoneValidation.isValid) {
        errors.contactNumber = phoneValidation.error || "Please enter a valid Philippine mobile number.";
      }
    }

    if (editAddress.trim().length > 200) {
      errors.address = "Address must be 200 characters or fewer.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Save changes handler
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    if (!validate()) return;

    setIsSaving(true);

    try {
      let finalAvatarUrl = avatarUrl;

      // 1. Process Avatar Removal if requested
      if (pendingRemoveAvatar) {
        const removeRes = await removeAvatar();
        if (!removeRes.success) {
          setFormError(removeRes.error || "Failed to remove profile photo.");
          setIsSaving(false);
          return;
        }
        finalAvatarUrl = null;
      }
      // 2. Process Avatar Upload if a new file was chosen
      else if (pendingAvatarFile) {
        const formData = new FormData();
        formData.append("avatar", pendingAvatarFile);
        const uploadRes = await uploadAvatar(formData);
        if (!uploadRes.success) {
          setFormError(uploadRes.error || "Failed to upload profile photo.");
          setIsSaving(false);
          return;
        }
        finalAvatarUrl = uploadRes.avatarUrl || previewAvatarUrl;
      }

      // 3. Process Profile Details Update
      const detailsRes = await updateUserProfileDetails({
        fullName: editFullName.trim(),
        barangay: editBarangay.trim(),
        address: editAddress.trim(),
        contactNumber: editContactNumber.trim(),
      });

      if (!detailsRes.success) {
        setFormError(detailsRes.error || "Failed to update profile information.");
        setIsSaving(false);
        return;
      }

      // 4. Update local state immediately
      const savedName = editFullName.trim();
      const savedBarangay = editBarangay.trim();
      const savedAddress = editAddress.trim();
      const savedPhone = editContactNumber.trim();

      setFullName(savedName);
      setBarangay(savedBarangay);
      setAddress(savedAddress);
      setContactNumber(savedPhone);
      setAvatarUrl(finalAvatarUrl);

      // 5. Synchronize with localStorage cache
      if (typeof window !== "undefined") {
        try {
          if (finalAvatarUrl) {
            localStorage.setItem("ecoguard_cached_avatar", finalAvatarUrl);
          } else {
            localStorage.removeItem("ecoguard_cached_avatar");
          }
          localStorage.setItem("ecoguard_cached_name", savedName);
        } catch {
          // Ignore storage quotas
        }
      }

      // 6. Dispatch events for real-time AppShell header/dropdown sync
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ecoguard:avatar-updated", {
            detail: { avatarUrl: finalAvatarUrl },
          })
        );
        window.dispatchEvent(
          new CustomEvent("ecoguard:profile-updated", {
            detail: { fullName: savedName, name: savedName },
          })
        );
      }

      // 7. Close modal and show success toast
      setIsEditModalOpen(false);
      setSuccessToast("Profile information updated successfully.");
      setTimeout(() => setSuccessToast(""), 5000);

      // 8. Refresh server-side data
      router.refresh();
    } catch (err: unknown) {
      console.error("Profile save error:", err);
      setFormError("An unexpected error occurred while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <section className="card tiktok-profile-card" style={{ position: "relative" }}>
        {/* Card Header with Title and Three-Dot Action Menu */}
        <div className="profile-card-header">
          <div>
            <h2 className="profile-card-title">Profile Information</h2>
            <p className="profile-card-subtitle">
              Official resident credentials and contact details registered with the MENR Office.
            </p>
          </div>
          <div className="profile-card-actions">
            <ActionMenu
              items={[
                {
                  id: "edit-profile",
                  label: "Edit Profile",
                  icon: <Pencil size={15} aria-hidden="true" />,
                  onClick: openEditModal,
                },
              ]}
              ariaLabel="Profile options menu"
              triggerIcon={<EllipsisVertical size={18} aria-hidden="true" />}
            />
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div
            className="notice success sm"
            role="status"
            style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Read-Only Profile Photo & Identity */}
        <div className="profile-avatar-display-section">
          <div className="profile-avatar-display-ring">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${fullName}'s profile photo`}
                width={104}
                height={104}
                className="profile-avatar-img"
                unoptimized
              />
            ) : (
              <div className="profile-avatar-fallback">
                {initials ? initials : <User size={44} aria-hidden="true" />}
              </div>
            )}
          </div>
          <h3 className="profile-name-heading">{fullName || "EcoGuard Resident"}</h3>
          <span className="profile-role-badge">
            <ShieldCheck size={13} aria-hidden="true" />
            {userRole}
          </span>
        </div>

        {/* Read-Only Personal Information Rows ("About You") */}
        <div className="tiktok-info-group">
          <div className="tiktok-group-label">About You</div>

          {/* Row 1: Full Name */}
          <div className="tiktok-info-row">
            <div className="tiktok-row-label">
              <span className="tiktok-row-title">Name</span>
            </div>
            <div className="tiktok-row-content">
              <div className="profile-readonly-value">
                {fullName ? (
                  <span className="profile-readonly-text">{fullName}</span>
                ) : (
                  <span className="profile-readonly-empty">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Registered Email (Permanently Read-Only) */}
          <div className="tiktok-info-row readonly">
            <div className="tiktok-row-label">
              <span className="tiktok-row-title">Email</span>
            </div>
            <div className="tiktok-row-content">
              <div
                className="profile-readonly-value"
                style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}
              >
                <span className="profile-readonly-text">{email}</span>
                <span className="tiktok-lock-tag" title="Secured by Supabase Authentication">
                  <Lock size={12} aria-hidden="true" />
                  Secured
                </span>
              </div>
              <span className="tiktok-subtext">
                Your login credential is tied to this registered email. Email cannot be modified through the profile interface.
              </span>
            </div>
          </div>

          {/* Row 3: Phone Number */}
          <div className="tiktok-info-row">
            <div className="tiktok-row-label">
              <span className="tiktok-row-title">Phone</span>
            </div>
            <div className="tiktok-row-content">
              <div className="profile-readonly-value">
                {contactNumber ? (
                  <span className="profile-readonly-text">{contactNumber}</span>
                ) : (
                  <span className="profile-readonly-empty">Not provided</span>
                )}
              </div>
              <span className="tiktok-subtext">
                Used by MENR personnel to contact you regarding filed environmental complaints or permit requests.
              </span>
            </div>
          </div>

          {/* Row 4: Barangay */}
          <div className="tiktok-info-row">
            <div className="tiktok-row-label">
              <span className="tiktok-row-title">Barangay</span>
            </div>
            <div className="tiktok-row-content">
              <div className="profile-readonly-value">
                {barangay ? (
                  <span className="profile-readonly-text">{barangay}, Mabini, Batangas</span>
                ) : (
                  <span className="profile-readonly-empty">Not provided</span>
                )}
              </div>
              <span className="tiktok-subtext">
                Official barangay of residence in the Municipality of Mabini.
              </span>
            </div>
          </div>

          {/* Row 5: Residential Address */}
          <div className="tiktok-info-row">
            <div className="tiktok-row-label">
              <span className="tiktok-row-title">Address</span>
            </div>
            <div className="tiktok-row-content">
              <div className="profile-readonly-value">
                {address ? (
                  <span className="profile-readonly-text">{address}</span>
                ) : (
                  <span className="profile-readonly-empty">Not provided</span>
                )}
              </div>
              <span className="tiktok-subtext">
                Specific street, purok, or sitio details for garbage pickup routing and municipal services.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Edit Profile Modal Dialog */}
      {isEditModalOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) {
              handleCancel();
            }
          }}
        >
          <div
            className="modal-card edit-profile-modal"
            style={{
              maxWidth: "540px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "20px",
                paddingBottom: "14px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <h3
                  id="edit-profile-modal-title"
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    margin: 0,
                    color: "var(--dark-forest)",
                  }}
                >
                  Edit Profile Information
                </h3>
                <p className="hint" style={{ fontSize: "12.5px", margin: "4px 0 0" }}>
                  Update your personal details and photo. Account email and role are protected.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="button secondary sm"
                style={{
                  padding: "6px",
                  borderRadius: "50%",
                  minWidth: "auto",
                  border: "none",
                  cursor: isSaving ? "not-allowed" : "pointer",
                }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Photo Editing Area */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: "20px",
                paddingBottom: "18px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,image/jpg"
                style={{ display: "none" }}
                disabled={isSaving}
                id="edit-profile-avatar-input"
              />

              <div
                style={{
                  position: "relative",
                  width: "96px",
                  height: "96px",
                  borderRadius: "50%",
                  border: "3px solid var(--primary-green)",
                  overflow: "hidden",
                  marginBottom: "12px",
                  background: "var(--surface-alt)",
                }}
              >
                {previewAvatarUrl ? (
                  <Image
                    src={previewAvatarUrl}
                    alt="Profile preview"
                    width={96}
                    height={96}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    unoptimized
                  />
                ) : (
                  <div
                    className="profile-avatar-fallback"
                    style={{ fontSize: "32px" }}
                  >
                    {initials || <User size={40} />}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12.5px",
                  }}
                >
                  <Camera size={14} aria-hidden="true" />
                  <span>Change Photo</span>
                </button>

                {previewAvatarUrl && (
                  <button
                    type="button"
                    className="button danger-outline sm"
                    onClick={handleRemovePhoto}
                    disabled={isSaving}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12.5px",
                    }}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              <span className="hint" style={{ fontSize: "11.5px", marginTop: "8px" }}>
                JPG, PNG, or WEBP up to 2 MB.
              </span>

              {photoError && (
                <div
                  className="notice error sm"
                  style={{ marginTop: "10px", width: "100%" }}
                  role="alert"
                >
                  <AlertCircle size={13} style={{ display: "inline-block", marginRight: "4px" }} />
                  {photoError}
                </div>
              )}
            </div>

            {/* Editable Form */}
            <form onSubmit={handleSave} noValidate>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* 1. Full Name */}
                <div className="form-field">
                  <label
                    htmlFor="edit-fullname"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Full Name <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input
                    id="edit-fullname"
                    type="text"
                    value={editFullName}
                    onChange={(e) => {
                      setEditFullName(e.target.value);
                      if (fieldErrors.fullName) {
                        setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                      }
                    }}
                    placeholder="Enter your full name"
                    maxLength={120}
                    disabled={isSaving}
                    className={`tiktok-row-input ${fieldErrors.fullName ? "error" : ""}`}
                    style={{ width: "100%" }}
                    required
                  />
                  {fieldErrors.fullName && (
                    <span className="field-error-msg">{fieldErrors.fullName}</span>
                  )}
                </div>

                {/* 2. Registered Email (Read-Only) */}
                <div className="form-field">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <label
                      htmlFor="edit-email"
                      style={{ fontSize: "13px", fontWeight: 600 }}
                    >
                      Registered Email Address
                    </label>
                    <span className="tiktok-lock-tag" style={{ fontSize: "11px" }}>
                      <Lock size={11} aria-hidden="true" /> Read-Only
                    </span>
                  </div>
                  <input
                    id="edit-email"
                    type="email"
                    value={email}
                    disabled
                    readOnly
                    className="tiktok-row-input"
                    style={{
                      width: "100%",
                      opacity: 0.75,
                      cursor: "not-allowed",
                      background: "var(--surface-subtle, var(--surface-alt))",
                    }}
                  />
                  <span className="hint" style={{ fontSize: "11.5px", marginTop: "4px", display: "block" }}>
                    Tied to your Supabase credentials. Email cannot be modified through the profile interface.
                  </span>
                </div>

                {/* 3. Account Role (Read-Only) */}
                <div className="form-field">
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Account Role
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="profile-role-badge">
                      <ShieldCheck size={12} aria-hidden="true" />
                      {userRole}
                    </span>
                    <span className="hint" style={{ fontSize: "11.5px" }}>
                      Assigned by municipal administration. Non-modifiable.
                    </span>
                  </div>
                </div>

                {/* 4. Phone Number */}
                <div className="form-field">
                  <label
                    htmlFor="edit-phone"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Phone Number
                  </label>
                  <input
                    id="edit-phone"
                    type="tel"
                    value={editContactNumber}
                    onChange={(e) => {
                      setEditContactNumber(e.target.value);
                      if (fieldErrors.contactNumber) {
                        setFieldErrors((prev) => ({ ...prev, contactNumber: "" }));
                      }
                    }}
                    placeholder="0917 123 4567"
                    disabled={isSaving}
                    className={`tiktok-row-input ${fieldErrors.contactNumber ? "error" : ""}`}
                    style={{ width: "100%" }}
                  />
                  {fieldErrors.contactNumber ? (
                    <span className="field-error-msg">{fieldErrors.contactNumber}</span>
                  ) : (
                    <span className="hint" style={{ fontSize: "11.5px", marginTop: "4px", display: "block" }}>
                      Optional. Philippine mobile format (e.g. 09171234567 or +639171234567).
                    </span>
                  )}
                </div>

                {/* 5. Barangay */}
                <div className="form-field">
                  <label
                    htmlFor="edit-barangay"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Barangay
                  </label>
                  <select
                    id="edit-barangay"
                    value={editBarangay}
                    onChange={(e) => setEditBarangay(e.target.value)}
                    disabled={isSaving}
                    className="tiktok-row-select"
                    style={{ width: "100%" }}
                  >
                    <option value="">Select your Mabini barangay</option>
                    {MABINI_BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <span className="hint" style={{ fontSize: "11.5px", marginTop: "4px", display: "block" }}>
                    Municipality of Mabini, Batangas (34 official barangays).
                  </span>
                </div>

                {/* 6. Residential Address */}
                <div className="form-field">
                  <label
                    htmlFor="edit-address"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Residential Address
                  </label>
                  <input
                    id="edit-address"
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="House / Building No., Street, Sitio, or Purok"
                    maxLength={200}
                    disabled={isSaving}
                    className="tiktok-row-input"
                    style={{ width: "100%" }}
                  />
                  <span className="hint" style={{ fontSize: "11.5px", marginTop: "4px", display: "block" }}>
                    Specific street or sitio details for garbage pickup routing and municipal delivery.
                  </span>
                </div>

                {/* Form Error Banner */}
                {formError && (
                  <div className="notice error sm" role="alert" style={{ marginTop: "6px" }}>
                    <AlertCircle size={14} style={{ display: "inline-block", marginRight: "6px" }} />
                    {formError}
                  </div>
                )}

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <button
                    type="button"
                    className="button secondary"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button green"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <LoaderCircle className="spin" size={16} aria-hidden="true" />
                    ) : (
                      <Check size={16} aria-hidden="true" />
                    )}
                    {isSaving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
