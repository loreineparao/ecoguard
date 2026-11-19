"use client";

import { useState } from "react";
import { updateUserProfileDetails } from "@/app/actions/profile";
import { MABINI_BARANGAYS } from "@/lib/mabini-constants";
import { validatePhoneNumber } from "@/lib/validators";
import {
  Check,
  LoaderCircle,
  Pencil,
  X,
  User,
  MapPin,
  Home,
  Phone,
  Shield,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

type ProfileFormProps = {
  initialFullName: string;
  initialBarangay?: string;
  initialAddress?: string;
  initialContactNumber?: string;
  userRole: string;
};

export default function ProfileForm({
  initialFullName,
  initialBarangay = "",
  initialAddress = "",
  initialContactNumber = "",
  userRole,
}: ProfileFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  // Profile data states
  const [fullName, setFullName] = useState(initialFullName);
  const [barangay, setBarangay] = useState(initialBarangay);
  const [address, setAddress] = useState(initialAddress);
  const [contactNumber, setContactNumber] = useState(initialContactNumber);

  // Staged edit states (for Cancel restoration)
  const [editFullName, setEditFullName] = useState(initialFullName);
  const [editBarangay, setEditBarangay] = useState(initialBarangay);
  const [editAddress, setEditAddress] = useState(initialAddress);
  const [editContactNumber, setEditContactNumber] = useState(initialContactNumber);

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [contactError, setContactError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleStartEditing() {
    setEditFullName(fullName);
    setEditBarangay(barangay);
    setEditAddress(address);
    setEditContactNumber(contactNumber);
    setNameError("");
    setContactError("");
    setFormError("");
    setSuccessMessage("");
    setIsEditing(true);
  }

  function handleCancel() {
    setEditFullName(fullName);
    setEditBarangay(barangay);
    setEditAddress(address);
    setEditContactNumber(contactNumber);
    setNameError("");
    setContactError("");
    setFormError("");
    setIsEditing(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNameError("");
    setContactError("");
    setFormError("");
    setSuccessMessage("");

    const trimmedName = editFullName.trim();
    if (!trimmedName) {
      setNameError("Full name is required and cannot be blank.");
      return;
    }

    if (trimmedName.length > 120) {
      setNameError("Full name must be 120 characters or fewer.");
      return;
    }

    const trimmedContact = editContactNumber.trim();
    if (trimmedContact) {
      const phoneValidation = validatePhoneNumber(trimmedContact);
      if (!phoneValidation.isValid) {
        setContactError(
          phoneValidation.error ||
            "Please enter a valid Philippine mobile number (e.g. 09171234567)."
        );
        return;
      }
    }

    setLoading(true);

    const result = await updateUserProfileDetails({
      fullName: trimmedName,
      barangay: editBarangay.trim(),
      address: editAddress.trim(),
      contactNumber: trimmedContact,
    });

    setLoading(false);

    if (!result.success) {
      setFormError(result.error ?? "Unable to update profile. Please try again.");
      return;
    }

    // Apply saved updates to persistent state
    setFullName(trimmedName);
    setBarangay(editBarangay.trim());
    setAddress(editAddress.trim());
    setContactNumber(trimmedContact);
    setSuccessMessage(result.message ?? "Profile information updated successfully.");
    setIsEditing(false);
    router.refresh();
  }

  return (
    <div className="profile-info-section">
      {/* View Mode (Clean Display of Profile Details) */}
      {!isEditing ? (
        <div className="profile-display-view">
          <div className="profile-display-grid">
            <div className="profile-display-item">
              <span className="profile-item-label">
                <User size={13} aria-hidden="true" /> Full Name
              </span>
              <strong className="profile-item-val">{fullName || "Not provided"}</strong>
            </div>

            <div className="profile-display-item">
              <span className="profile-item-label">
                <MapPin size={13} aria-hidden="true" /> Barangay
              </span>
              <strong className="profile-item-val">
                {barangay || "Mabini Jurisdiction (Unspecified)"}
              </strong>
            </div>

            <div className="profile-display-item">
              <span className="profile-item-label">
                <Home size={13} aria-hidden="true" /> Residential Address
              </span>
              <span className="profile-item-val">
                {address || "No street/sitio address specified"}
              </span>
            </div>

            <div className="profile-display-item">
              <span className="profile-item-label">
                <Phone size={13} aria-hidden="true" /> Contact Number
              </span>
              <span className="profile-item-val">
                {contactNumber || "No mobile number on file"}
              </span>
            </div>

            <div className="profile-display-item">
              <span className="profile-item-label">
                <Shield size={13} aria-hidden="true" /> Account Role
              </span>
              <span className="profile-item-val">
                <span className="badge resolved" style={{ fontSize: "11.5px" }}>
                  {userRole}
                </span>
                <small style={{ display: "block", color: "var(--text-secondary)", marginTop: "3px" }}>
                  System privileges are managed by the MENR Office.
                </small>
              </span>
            </div>
          </div>

          {successMessage && (
            <div className="notice success sm" role="status" style={{ marginTop: "14px" }}>
              <Check size={14} style={{ display: "inline-block", marginRight: "6px" }} />
              {successMessage}
            </div>
          )}

          <div style={{ marginTop: "18px" }}>
            <button
              type="button"
              className="button green"
              onClick={handleStartEditing}
              style={{ width: "fit-content" }}
            >
              <Pencil size={14} aria-hidden="true" /> Edit Profile
            </button>
          </div>
        </div>
      ) : (
        /* Edit Mode (Interactive Inputs with Save Changes & Cancel) */
        <form className="settings-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-field">
            <label htmlFor="settings-full-name">
              Full Name <span aria-hidden="true">*</span>
            </label>
            <input
              id="settings-full-name"
              type="text"
              value={editFullName}
              onChange={(e) => {
                setEditFullName(e.target.value);
                if (nameError) setNameError("");
              }}
              placeholder="e.g. Maria Santos Dela Cruz"
              autoComplete="name"
              disabled={loading}
              required
              aria-invalid={Boolean(nameError)}
              style={nameError ? { borderColor: "#DC2626" } : undefined}
            />
            {nameError && (
              <p className="field-error-text" role="alert">
                <AlertCircle size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                {nameError}
              </p>
            )}
            <p className="hint">
              This name appears on your submitted complaints, permit applications, and official receipts.
            </p>
          </div>

          {/* Barangay Selection */}
          <div className="form-field">
            <label htmlFor="settings-barangay">
              Barangay in Mabini, Batangas
            </label>
            <select
              id="settings-barangay"
              value={editBarangay}
              onChange={(e) => setEditBarangay(e.target.value)}
              disabled={loading}
            >
              <option value="">Select your Barangay (Optional)</option>
              {MABINI_BARANGAYS.map((b) => (
                <option key={b} value={b}>
                  Barangay {b}
                </option>
              ))}
            </select>
            <p className="hint">
              Helps the MENR Office route complaint inspections and garbage collection notices.
            </p>
          </div>

          {/* Residential Address */}
          <div className="form-field">
            <label htmlFor="settings-address">
              Street, Sitio, or Purok Address
            </label>
            <input
              id="settings-address"
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="e.g. Purok 3, Near Barangay Hall"
              autoComplete="street-address"
              disabled={loading}
            />
          </div>

          {/* Contact Number */}
          <div className="form-field">
            <label htmlFor="settings-contact">
              Mobile Contact Number
            </label>
            <input
              id="settings-contact"
              type="tel"
              value={editContactNumber}
              onChange={(e) => {
                setEditContactNumber(e.target.value);
                if (contactError) setContactError("");
              }}
              placeholder="e.g. 09171234567"
              autoComplete="tel"
              disabled={loading}
              aria-invalid={Boolean(contactError)}
              style={contactError ? { borderColor: "#DC2626" } : undefined}
            />
            {contactError && (
              <p className="field-error-text" role="alert">
                <AlertCircle size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                {contactError}
              </p>
            )}
            <p className="hint">
              Used by MENR field officers to coordinate regarding your submitted reports or permits.
            </p>
          </div>

          {formError && (
            <div className="notice error" role="alert">
              <AlertCircle size={14} style={{ display: "inline-block", marginRight: "6px" }} />
              {formError}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
            <button
              className="button green"
              type="submit"
              disabled={loading || !editFullName.trim()}
              style={{ minWidth: "130px" }}
            >
              {loading ? (
                <LoaderCircle className="spin" size={15} aria-hidden="true" />
              ) : (
                <Check size={15} aria-hidden="true" />
              )}
              {loading ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              className="button secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              <X size={15} aria-hidden="true" /> Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
