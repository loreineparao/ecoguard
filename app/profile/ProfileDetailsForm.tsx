"use client";

import { useState, useTransition } from "react";
import { updateUserProfileDetails } from "@/app/actions/profile";
import { MABINI_BARANGAYS } from "@/lib/mabini-constants";
import { validatePhoneNumber } from "@/lib/validators";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  Lock,
  Check,
  AlertCircle,
  LoaderCircle,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";

type ProfileDetailsFormProps = {
  initialFullName: string;
  email: string;
  initialBarangay: string;
  initialAddress: string;
  initialContactNumber: string;
  userRole: string;
};

export default function ProfileDetailsForm({
  initialFullName,
  email,
  initialBarangay,
  initialAddress,
  initialContactNumber,
  userRole,
}: ProfileDetailsFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [barangay, setBarangay] = useState(initialBarangay);
  const [address, setAddress] = useState(initialAddress);
  const [contactNumber, setContactNumber] = useState(initialContactNumber);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const isVerifiedResident = userRole.toLowerCase().includes("resident") || userRole.toLowerCase().includes("admin");

  function validate() {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "Full name is required.";
    } else if (fullName.trim().length > 120) {
      errors.fullName = "Full name must be 120 characters or fewer.";
    }

    if (contactNumber.trim()) {
      const phoneValidation = validatePhoneNumber(contactNumber.trim());
      if (!phoneValidation.isValid) {
        errors.contactNumber = phoneValidation.error || "Please enter a valid Philippine mobile number.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!validate()) return;

    startTransition(async () => {
      const res = await updateUserProfileDetails({
        fullName: fullName.trim(),
        barangay: barangay.trim(),
        address: address.trim(),
        contactNumber: contactNumber.trim(),
      });

      if (!res.success) {
        setFormError(res.error || "Failed to update profile information.");
        return;
      }

      setFormSuccess(res.message || "Profile information updated successfully.");
      router.refresh();
    });
  }

  return (
    <div className="tiktok-profile-form-container">
      <form onSubmit={handleSubmit} noValidate>
        {/* TikTok-style Information Rows Group */}
        <div className="tiktok-info-group">
          <div className="tiktok-group-label">About You</div>

          {/* Row 1: Full Name */}
          <div className="tiktok-info-row">
            <div className="tiktok-row-label">
              <span className="tiktok-row-title">Name</span>
            </div>
            <div className="tiktok-row-content">
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) {
                    setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                  }
                }}
                placeholder="Enter your full name"
                className={`tiktok-row-input ${fieldErrors.fullName ? "error" : ""}`}
                disabled={isPending}
                maxLength={120}
                required
              />
              {fieldErrors.fullName && (
                <span className="field-error-msg">{fieldErrors.fullName}</span>
              )}
            </div>
          </div>

          {/* Row 2: Email (Read-Only / Protected) */}
          <div className="tiktok-info-row readonly">
            <div className="tiktok-row-label">
              <span className="tiktok-row-title">Email</span>
            </div>
            <div className="tiktok-row-content">
              <div className="tiktok-readonly-value">
                <span>{email}</span>
                <span className="tiktok-lock-tag" title="Email is verified and secured by Supabase Authentication">
                  <Lock size={12} aria-hidden="true" />
                  Secured
                </span>
              </div>
              <span className="tiktok-subtext">
                Your login credential is tied to your registered email. Visit Settings to change security details.
              </span>
            </div>
          </div>

          {/* Row 3: Contact Number */}
          <div className="tiktok-info-row">
            <div className="tiktok-row-label">
              <span className="tiktok-row-title">Phone</span>
            </div>
            <div className="tiktok-row-content">
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => {
                  setContactNumber(e.target.value);
                  if (fieldErrors.contactNumber) {
                    setFieldErrors((prev) => ({ ...prev, contactNumber: "" }));
                  }
                }}
                placeholder="0917 123 4567"
                className={`tiktok-row-input ${fieldErrors.contactNumber ? "error" : ""}`}
                disabled={isPending}
              />
              {fieldErrors.contactNumber ? (
                <span className="field-error-msg">{fieldErrors.contactNumber}</span>
              ) : (
                <span className="tiktok-subtext">
                  Used by MENR inspectors to contact you regarding filed complaints or permit inspections.
                </span>
              )}
            </div>
          </div>

          {/* Row 4: Barangay */}
          <div className="tiktok-info-row">
            <div className="tiktok-row-label">
              <span className="tiktok-row-title">Barangay</span>
            </div>
            <div className="tiktok-row-content">
              <select
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                className="tiktok-row-select"
                disabled={isPending}
              >
                <option value="">Select your Mabini barangay</option>
                {MABINI_BARANGAYS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <span className="tiktok-subtext">
                Municipality of Mabini, Batangas (34 official barangays)
              </span>
            </div>
          </div>

          {/* Row 5: Residential Address */}
          <div className="tiktok-info-row">
            <div className="tiktok-row-label">
              <span className="tiktok-row-title">Address</span>
            </div>
            <div className="tiktok-row-content">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Building No., Street, Sitio, or Purok"
                className="tiktok-row-input"
                disabled={isPending}
                maxLength={200}
              />
              <span className="tiktok-subtext">
                Specific street or sitio details for garbage pickup and municipal delivery.
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Banners */}
        {formError && (
          <div className="notice error sm" role="alert" style={{ marginTop: "16px" }}>
            <AlertCircle size={14} style={{ display: "inline-block", marginRight: "6px" }} />
            {formError}
          </div>
        )}

        {formSuccess && (
          <div className="notice success sm" role="status" style={{ marginTop: "16px" }}>
            <Check size={14} style={{ display: "inline-block", marginRight: "6px" }} />
            {formSuccess}
          </div>
        )}

        {/* Save Button */}
        <div className="tiktok-form-footer">
          <button
            type="submit"
            className="button green"
            disabled={isPending}
          >
            {isPending ? (
              <LoaderCircle className="spin" size={16} aria-hidden="true" />
            ) : (
              <Check size={16} aria-hidden="true" />
            )}
            {isPending ? "Saving Changes..." : "Save Profile Details"}
          </button>
        </div>
      </form>

      {/* Resident Verification & Identity Card */}
      <div className="card tiktok-verification-card">
        <div className="tiktok-verification-header">
          <div className="tiktok-verification-badge-icon">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div>
            <h3>Resident Verification &amp; Identity</h3>
            <p>Certified municipal resident credentials managed by the MENR Office.</p>
          </div>
        </div>

        <div className="tiktok-verification-grid">
          <div className="tiktok-v-item">
            <span className="tiktok-v-label">Verification Status</span>
            <span className="tiktok-v-value success">
              <ShieldCheck size={13} aria-hidden="true" />
              Verified Mabini Resident
            </span>
          </div>

          <div className="tiktok-v-item">
            <span className="tiktok-v-label">Certification Authority</span>
            <span className="tiktok-v-value">
              MENR Office • Mabini, Batangas
            </span>
          </div>

          <div className="tiktok-v-item">
            <span className="tiktok-v-label">Verified Document Type</span>
            <span className="tiktok-v-value">
              Barangay Residency Certificate / Official Government ID
            </span>
          </div>

          <div className="tiktok-v-item">
            <span className="tiktok-v-label">Registered Barangay</span>
            <span className="tiktok-v-value">
              {barangay || "Mabini Resident (General)"}
            </span>
          </div>
        </div>

        <div className="tiktok-tamper-notice">
          <Info size={15} style={{ color: "var(--primary-green)", flexShrink: 0, marginTop: "1px" }} />
          <span>
            <strong>Tamper-Proof Notice:</strong> Resident verification status and official credentials are authenticated directly by municipal authorities. Any modifications require presenting updated documentation to the MENR Office at the Municipal Hall Complex.
          </span>
        </div>
      </div>
    </div>
  );
}
