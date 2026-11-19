"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/validators";
import {
  KeyRound,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

type PasswordSettingsFormProps = {
  userEmail: string;
};

export default function PasswordSettingsForm({
  userEmail,
}: PasswordSettingsFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Independent eye toggle states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status and error states
  const [currentError, setCurrentError] = useState("");
  const [newError, setNewError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentError("");
    setNewError("");
    setConfirmError("");
    setGlobalError("");
    setSuccessMessage("");

    let hasClientError = false;

    // 1. Validate Current Password presence
    if (!currentPassword) {
      setCurrentError("Please enter your current password.");
      hasClientError = true;
    }

    // 2. Validate New Password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setNewError(passwordValidation.error || "Password must be at least 6 characters.");
      hasClientError = true;
    }

    // 3. Confirm Password Match
    if (!confirmPassword) {
      setConfirmError("Please confirm your new password.");
      hasClientError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmError("New passwords do not match. Please re-enter.");
      hasClientError = true;
    }

    // 4. Ensure new password differs from current
    if (currentPassword && newPassword && currentPassword === newPassword) {
      setNewError("Your new password must be different from your current password.");
      hasClientError = true;
    }

    if (hasClientError) return;

    setLoading(true);

    try {
      const supabase = createClient();

      // Step 1: Re-authenticate to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        setCurrentError("The current password you entered is incorrect.");
        setLoading(false);
        return;
      }

      // Step 2: Update password via official Supabase Auth flow
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setGlobalError(updateError.message || "Unable to update password right now.");
        setLoading(false);
        return;
      }

      // Success
      setSuccessMessage("Your password has been changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsExpanded(false);
    } catch {
      setGlobalError("A network error occurred while updating your password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="settings-section-card">
      <div className="settings-section-header">
        <div className="settings-section-icon">
          <KeyRound size={18} aria-hidden="true" />
        </div>
        <div>
          <h3>Password & Security</h3>
          <p className="hint">
            Ensure your account is protected with a secure password.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="notice success sm" role="status" style={{ marginTop: "12px" }}>
          <Check size={14} style={{ display: "inline-block", marginRight: "6px" }} />
          {successMessage}
        </div>
      )}

      {!isExpanded ? (
        <div style={{ marginTop: "14px" }}>
          <button
            type="button"
            className="button secondary sm"
            onClick={() => {
              setIsExpanded(true);
              setSuccessMessage("");
              setGlobalError("");
            }}
          >
            Change Password
          </button>
        </div>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="settings-subform" noValidate>
          {/* Current Password Field */}
          <div className="form-field">
            <label htmlFor="settings-current-password">
              Current Password <span aria-hidden="true">*</span>
            </label>
            <div className="password-input-wrap">
              <input
                id="settings-current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (currentError) setCurrentError("");
                }}
                placeholder="Enter your current password"
                autoComplete="current-password"
                disabled={loading}
                required
                aria-invalid={Boolean(currentError)}
                style={currentError ? { borderColor: "#DC2626" } : undefined}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowCurrent((p) => !p)}
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
                title={showCurrent ? "Hide current password" : "Show current password"}
              >
                {showCurrent ? <Eye size={17} aria-hidden="true" /> : <EyeOff size={17} aria-hidden="true" />}
              </button>
            </div>
            {currentError && (
              <p className="field-error-text" role="alert">
                <AlertCircle size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                {currentError}
              </p>
            )}
            <div style={{ marginTop: "4px" }}>
              <Link
                href="/auth/reset-password"
                className="hint"
                style={{ color: "var(--primary-green)", textDecoration: "underline", fontSize: "12px" }}
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* New Password Field */}
          <div className="form-field">
            <label htmlFor="settings-new-password">
              New Password <span aria-hidden="true">*</span>
            </label>
            <div className="password-input-wrap">
              <input
                id="settings-new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (newError) setNewError("");
                }}
                placeholder="Minimum 6 characters"
                minLength={6}
                autoComplete="new-password"
                disabled={loading}
                required
                aria-invalid={Boolean(newError)}
                style={newError ? { borderColor: "#DC2626" } : undefined}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowNew((p) => !p)}
                aria-label={showNew ? "Hide new password" : "Show new password"}
                title={showNew ? "Hide new password" : "Show new password"}
              >
                {showNew ? <Eye size={17} aria-hidden="true" /> : <EyeOff size={17} aria-hidden="true" />}
              </button>
            </div>
            {newError && (
              <p className="field-error-text" role="alert">
                <AlertCircle size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                {newError}
              </p>
            )}
            <p className="hint">
              Minimum 6 characters. For enhanced security, 12+ characters are recommended.
            </p>
          </div>

          {/* Confirm New Password Field */}
          <div className="form-field">
            <label htmlFor="settings-confirm-password">
              Confirm New Password <span aria-hidden="true">*</span>
            </label>
            <div className="password-input-wrap">
              <input
                id="settings-confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmError) setConfirmError("");
                }}
                placeholder="Re-enter your new password"
                minLength={6}
                autoComplete="new-password"
                disabled={loading}
                required
                aria-invalid={Boolean(confirmError)}
                style={confirmError ? { borderColor: "#DC2626" } : undefined}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirm((p) => !p)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                title={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <Eye size={17} aria-hidden="true" /> : <EyeOff size={17} aria-hidden="true" />}
              </button>
            </div>
            {confirmError && (
              <p className="field-error-text" role="alert">
                <AlertCircle size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                {confirmError}
              </p>
            )}
          </div>

          {globalError && (
            <div className="notice error sm" role="alert" style={{ marginTop: "10px" }}>
              <AlertCircle size={14} style={{ display: "inline-block", marginRight: "6px" }} />
              {globalError}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
            <button
              className="button green sm"
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            >
              {loading ? (
                <LoaderCircle className="spin" size={14} aria-hidden="true" />
              ) : (
                <ShieldCheck size={14} aria-hidden="true" />
              )}
              {loading ? "Updating..." : "Update Password"}
            </button>

            <button
              type="button"
              className="button secondary sm"
              onClick={() => {
                setIsExpanded(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setCurrentError("");
                setNewError("");
                setConfirmError("");
                setGlobalError("");
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
