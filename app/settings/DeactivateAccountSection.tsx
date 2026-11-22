"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deactivateOwnAccount } from "@/app/actions/deactivate-account";
import { createClient } from "@/lib/supabase/client";
import {
  UserX,
  AlertTriangle,
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldAlert,
} from "lucide-react";

type DeactivateAccountSectionProps = {
  userRole: string;
  userEmail: string;
};

const REASON_OPTIONS = [
  "I no longer reside in Mabini, Batangas.",
  "I have privacy or data preferences.",
  "I experienced technical difficulties.",
  "I created another account.",
  "Other (optional explanation)",
] as const;

export default function DeactivateAccountSection({
  userRole,
  userEmail,
}: DeactivateAccountSectionProps) {
  const router = useRouter();
  const isAdmin = userRole.toLowerCase().includes("admin");

  // Modal State: 1 = Warning & Notice, 2 = Reason for leaving, 3 = Password & Confirmation
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form inputs
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherText, setOtherText] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function openModal() {
    setIsOpen(true);
    setStep(1);
    setSelectedReason("");
    setOtherText("");
    setPassword("");
    setShowPassword(false);
    setHasConfirmed(false);
    setError("");
    setSuccess("");
  }

  function closeModal() {
    if (loading) return;
    setIsOpen(false);
    setStep(1);
    setPassword("");
    setHasConfirmed(false);
    setError("");
  }

  async function handleConfirmDeactivation() {
    setError("");
    const cleanPassword = password.trim();

    if (!cleanPassword) {
      setError("Please enter your current password to confirm your identity.");
      return;
    }

    if (!hasConfirmed) {
      setError("Please check the confirmation box to proceed with deactivation.");
      return;
    }

    setLoading(true);

    try {
      const finalReason =
        selectedReason === "Other (optional explanation)"
          ? otherText.trim() || "Other reason"
          : selectedReason;

      const result = await deactivateOwnAccount({
        password: cleanPassword,
        reason: finalReason,
        reasonOther: otherText.trim(),
      });

      if (!result.success) {
        setError(result.error || "Unable to complete account deactivation.");
        setLoading(false);
        return;
      }

      setSuccess("Account successfully deactivated. Closing session...");

      // Client-side session and storage cleanup
      try {
        const supabase = createClient();
        await supabase.auth.signOut({ scope: "global" });
      } catch {
        // Fallback
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          // Ignore quota error
        }
      }

      router.push(result.redirectUrl || "/login?notice=account_deactivated");
    } catch {
      setError("A connection error occurred while deactivating your account. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="settings-section-card">
      <div className="settings-section-header">
        <div
          className="settings-section-icon"
          style={{
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            color: "#DC2626",
          }}
        >
          <UserX size={18} aria-hidden="true" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", color: "var(--dark-forest)" }}>Deactivate Account</h3>
          <p className="hint">
            Disable your EcoGuard account and remove your access to the Resident Portal.
          </p>
        </div>
      </div>

      {error && (
        <div className="notice error sm" role="alert" style={{ marginTop: "12px" }}>
          <AlertCircle size={14} style={{ display: "inline-block", marginRight: "6px" }} />
          {error}
        </div>
      )}

      {success && (
        <div className="notice success sm" role="status" style={{ marginTop: "12px" }}>
          <CheckCircle2 size={14} style={{ display: "inline-block", marginRight: "6px" }} />
          {success}
        </div>
      )}

      {isAdmin ? (
        <div className="notice warning sm" style={{ marginTop: "14px" }}>
          Administrator accounts cannot be deactivated through this portal. Please contact the Municipal Human Resources Office or Municipal IT Administrator for credential decommissioning.
        </div>
      ) : (
        <div style={{ marginTop: "14px" }}>
          <button
            type="button"
            className="button danger-outline sm"
            onClick={openModal}
            aria-haspopup="dialog"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <UserX size={14} aria-hidden="true" /> Deactivate Account
          </button>
        </div>
      )}

      {/* Multi-Step Deactivation Modal */}
      {isOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="deactivate-modal-title">
          <div className="modal-container deactivate-modal-container" style={{ maxWidth: "520px" }}>
            <div className="modal-header deactivate-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#DC2626", display: "inline-flex" }}>
                  <ShieldAlert size={20} aria-hidden="true" />
                </span>
                <h3 id="deactivate-modal-title" className="deactivate-modal-title" style={{ margin: 0, fontSize: "17px" }}>
                  Deactivate EcoGuard Account
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeModal}
                disabled={loading}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body deactivate-modal-body">
              {/* Stepper Indicator */}
              <div className="deactivate-stepper">
                <span className={`deactivate-step-item ${step === 1 ? "active" : ""}`}>
                  1. Information &amp; Notice
                </span>
                <span className="deactivate-step-arrow">→</span>
                <span className={`deactivate-step-item ${step === 2 ? "active" : ""}`}>
                  2. Reason (Optional)
                </span>
                <span className="deactivate-step-arrow">→</span>
                <span className={`deactivate-step-item ${step === 3 ? "active" : ""}`}>
                  3. Verify &amp; Confirm
                </span>
              </div>

              {error && (
                <div className="notice error sm" style={{ marginBottom: "16px" }}>
                  <AlertCircle size={14} style={{ display: "inline-block", marginRight: "6px" }} />
                  {error}
                </div>
              )}

              {/* STEP 1: Explanatory Warning & Official Records Notice */}
              {step === 1 && (
                <div>
                  <div className="deactivate-warning-box">
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <AlertTriangle size={18} className="deactivate-warning-icon" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div className="deactivate-warning-content">
                        <strong className="deactivate-warning-title">
                          What happens when you deactivate your account:
                        </strong>
                        <ul className="deactivate-warning-list">
                          <li>Your portal access and active login sessions will be disabled immediately.</li>
                          <li>You will not be able to log in or file new environmental reports.</li>
                          <li>
                            Previously submitted complaints and permit applications remain archived as official municipal records for MENR tracking and compliance.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <p className="deactivate-notice-text">
                    <strong>Note:</strong> Deactivation disables your account access while preserving official municipal history. If you require formal privacy-related erasure under the Data Privacy Act of 2012 (RA 10173), please contact the MENR Office Data Protection Officer.
                  </p>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                    <button type="button" className="button secondary sm" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="button danger sm"
                      onClick={() => setStep(2)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Optional Reason for Leaving */}
              {step === 2 && (
                <div>
                  <p className="deactivate-step-prompt">
                    Please let us know why you are deactivating your account (optional):
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                    {REASON_OPTIONS.map((opt) => (
                      <label
                        key={opt}
                        className={`deactivate-reason-option ${selectedReason === opt ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="deactivationReason"
                          value={opt}
                          checked={selectedReason === opt}
                          onChange={(e) => setSelectedReason(e.target.value)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>

                  {selectedReason === "Other (optional explanation)" && (
                    <div style={{ marginBottom: "16px" }}>
                      <textarea
                        className="input deactivate-reason-textarea"
                        rows={3}
                        placeholder="Please share details (optional)..."
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        maxLength={300}
                      />
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                    <button
                      type="button"
                      className="button secondary sm"
                      onClick={() => setStep(1)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      type="button"
                      className="button danger sm"
                      onClick={() => setStep(3)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      Next: Verify Password <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Current Password Verification & Explicit Confirmation */}
              {step === 3 && (
                <div>
                  <div style={{ marginBottom: "16px" }}>
                    <label
                      htmlFor="deactivate-password"
                      className="deactivate-password-label"
                      style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}
                    >
                      Current Password <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <div className="password-input-wrap">
                      <input
                        id="deactivate-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError("");
                        }}
                        placeholder="Enter your current password"
                        autoComplete="current-password"
                        disabled={loading}
                        required
                        style={{ width: "100%" }}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword((prev) => !prev)}
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <small className="deactivate-password-hint" style={{ fontSize: "11.5px", marginTop: "4px", display: "block" }}>
                      Confirming your password verifies that you are the authorized resident for {userEmail}.
                    </small>
                  </div>

                  <div className="deactivate-confirm-box">
                    <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={hasConfirmed}
                        onChange={(e) => setHasConfirmed(e.target.checked)}
                        disabled={loading}
                        style={{ marginTop: "3px" }}
                      />
                      <span className="deactivate-confirm-text">
                        I understand that deactivating my account will disable my access to the Resident Portal and log me out.
                      </span>
                    </label>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                    <button
                      type="button"
                      className="button secondary sm"
                      onClick={() => setStep(2)}
                      disabled={loading}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      type="button"
                      className="button danger sm"
                      onClick={handleConfirmDeactivation}
                      disabled={loading || !password || !hasConfirmed}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      {loading ? (
                        <>
                          <LoaderCircle size={14} className="spin" /> Deactivating...
                        </>
                      ) : (
                        <>
                          <UserX size={14} /> Confirm Deactivation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
