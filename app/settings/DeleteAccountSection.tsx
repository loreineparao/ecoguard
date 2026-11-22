"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteOwnAccount } from "@/app/actions/delete-account";
import { createClient } from "@/lib/supabase/client";
import {
  Trash2,
  AlertTriangle,
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";

type DeleteAccountSectionProps = {
  userRole: string;
  userEmail: string;
};

const REASON_OPTIONS = [
  "I no longer need EcoGuard.",
  "I have privacy concerns.",
  "I created another account.",
  "I experienced technical problems.",
  "Other (optional explanation)",
] as const;

export default function DeleteAccountSection({
  userRole,
  userEmail,
}: DeleteAccountSectionProps) {
  const router = useRouter();
  const isAdmin = userRole.toLowerCase().includes("admin");

  // Modal State: 1 = Warning, 2 = Reason, 3 = Confirm Identity & Delete
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form inputs
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherText, setOtherText] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Submission & Feedback
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
    setError("");
    setSuccess("");
  }

  function closeModal() {
    if (loading) return; // Prevent closing mid-deletion
    setIsOpen(false);
    setStep(1);
    setPassword("");
    setError("");
  }

  // Final Action: Permanently Delete My Account
  async function handlePermanentDelete() {
    setError("");
    const cleanPassword = password.trim();

    if (!cleanPassword) {
      setError("Please enter your current password to confirm your identity.");
      return;
    }

    setLoading(true);

    try {
      const finalReason =
        selectedReason === "Other (optional explanation)"
          ? otherText.trim() || "Other reason"
          : selectedReason;

      const result = await deleteOwnAccount({
        password: cleanPassword,
        reason: finalReason,
        reasonOther: otherText.trim(),
      });

      if (!result.success) {
        setError(result.error || "Unable to complete account deletion.");
        setLoading(false);
        return;
      }

      setSuccess("Account successfully deleted. Clearing session and redirecting...");

      // Global client-side session cleanup
      try {
        const supabase = createClient();
        await supabase.auth.signOut({ scope: "global" });
      } catch {
        // Fallback if network drops
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          // Ignore storage quota errors
        }
      }

      router.push(result.redirectUrl || "/login?notice=account_deleted");
    } catch {
      setError("A connection error occurred while deleting your account. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="settings-section-card">
      <div className="settings-section-header">
        <div
          className="settings-section-icon"
          style={{
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
          }}
        >
          <Trash2 size={18} aria-hidden="true" />
        </div>
        <div>
          <h3 style={{ color: "#B91C1C", margin: 0 }}>Delete Account</h3>
          <p className="hint">
            Permanently delete your EcoGuard account and remove your access to the Resident Portal.
          </p>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Trigger Button */}
      {isAdmin ? (
        <div className="notice warning sm" style={{ marginTop: "14px" }}>
          Administrator accounts cannot be self-deleted through this portal. Please contact the Municipal Human Resources Office or Municipal IT Administrator for credential decommissioning.
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
            <Trash2 size={14} aria-hidden="true" /> Delete Account
          </button>
        </div>
      )}

      {/* Multi-Step Deletion Confirmation Dialog */}
      {isOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deletion-modal-title"
        >
          <div className="modal-card" style={{ maxWidth: "500px", position: "relative" }}>
            
            {/* Modal Top Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#FEE2E2",
                    color: "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={18} aria-hidden="true" />
                </div>
                <div>
                  <h3 id="deletion-modal-title" style={{ margin: 0, fontSize: "16px", color: "#991B1B" }}>
                    Delete Account
                  </h3>
                  <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                    Step {step} of 3 &bull; {step === 1 ? "Permanent Warning" : step === 2 ? "Reason for Leaving" : "Confirm Identity"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                aria-label="Close dialog"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  color: "var(--text-secondary)",
                  padding: "4px",
                  borderRadius: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Error in modal */}
            {error && (
              <div className="notice error sm" role="alert" style={{ marginBottom: "16px" }}>
                <AlertCircle size={14} style={{ display: "inline-block", marginRight: "6px" }} />
                {error}
              </div>
            )}

            {/* STEP 1 — Delete Account & Permanent Warning */}
            {step === 1 && (
              <div>
                <p style={{ fontSize: "13.5px", color: "var(--dark-forest)", lineHeight: 1.6, margin: "0 0 14px" }}>
                  Are you sure you want to delete your EcoGuard resident account? This action is permanent and cannot be reversed.
                </p>

                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    marginBottom: "16px",
                    fontSize: "12.5px",
                    color: "#991B1B",
                    lineHeight: 1.55,
                  }}
                >
                  <p style={{ margin: "0 0 6px 0", fontWeight: 700 }}>Information Treatment:</p>
                  <ul style={{ margin: 0, paddingLeft: "18px" }}>
                    <li>
                      <strong>Personal Information Deleted:</strong> Your login credentials, session, profile contact
                      numbers, address, and uploaded profile avatars will be permanently deleted.
                    </li>
                    <li style={{ marginTop: "4px" }}>
                      <strong>Official Records Retained:</strong> Under municipal records management and environmental
                      policies, submitted environmental complaints, violation photos, and tree-cutting permit records
                      must be retained for public administration and will be anonymized.
                    </li>
                  </ul>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                  <button
                    type="button"
                    className="button secondary sm"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="button danger sm"
                    onClick={() => {
                      setError("");
                      setStep(2);
                    }}
                  >
                    Continue <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — Reason for Leaving (Optional) */}
            {step === 2 && (
              <div>
                <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--dark-forest)", margin: "0 0 4px" }}>
                  Why are you deleting your account?
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 14px" }}>
                  This step is optional. You may select a reason or skip directly to identity confirmation.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                  {REASON_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: selectedReason === opt ? "var(--light-green)" : "var(--surface)",
                        cursor: "pointer",
                        fontSize: "12.5px",
                        color: "var(--text-main)",
                      }}
                    >
                      <input
                        type="radio"
                        name="deletion-reason"
                        value={opt}
                        checked={selectedReason === opt}
                        onChange={(e) => setSelectedReason(e.target.value)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>

                {selectedReason === "Other (optional explanation)" && (
                  <div className="form-field" style={{ marginBottom: "14px" }}>
                    <label htmlFor="other-explanation-input" style={{ fontSize: "12px" }}>
                      Optional Explanation:
                    </label>
                    <input
                      id="other-explanation-input"
                      type="text"
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder="Share additional context if you wish"
                      maxLength={150}
                      autoFocus
                    />
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "20px" }}>
                  <button
                    type="button"
                    className="button secondary sm"
                    onClick={() => {
                      setError("");
                      setStep(1);
                    }}
                  >
                    <ArrowLeft size={14} aria-hidden="true" /> Back
                  </button>
                  <button
                    type="button"
                    className="button danger sm"
                    onClick={() => {
                      setError("");
                      setStep(3);
                    }}
                  >
                    Continue <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — Confirm Identity & Final Deletion */}
            {step === 3 && (
              <div>
                <p style={{ fontSize: "13px", color: "var(--dark-forest)", margin: "0 0 12px" }}>
                  Account deletion is permanent. To confirm your identity and authorize the permanent deletion of your
                  account (<strong>{userEmail}</strong>), please enter your current password:
                </p>

                <div className="form-field" style={{ marginBottom: "16px" }}>
                  <label htmlFor="modal-identity-password">
                    Current Password <span aria-hidden="true">*</span>
                  </label>
                  <div className="password-input-wrap">
                    <input
                      id="modal-identity-password"
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
                      autoFocus
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                    </button>
                  </div>
                  <p className="hint" style={{ fontSize: "11px", marginTop: "4px" }}>
                    Identity verification is processed securely through Supabase Authentication. Passwords are never logged or stored.
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "20px" }}>
                  <button
                    type="button"
                    className="button secondary sm"
                    onClick={() => {
                      if (!loading) {
                        setError("");
                        setStep(2);
                      }
                    }}
                    disabled={loading}
                  >
                    <ArrowLeft size={14} aria-hidden="true" /> Back
                  </button>
                  <button
                    type="button"
                    className="button danger sm"
                    onClick={handlePermanentDelete}
                    disabled={loading || !password.trim()}
                    style={{ backgroundColor: "#DC2626", borderColor: "#DC2626", color: "#FFFFFF" }}
                  >
                    {loading ? (
                      <>
                        <LoaderCircle className="spin" size={14} aria-hidden="true" /> Deleting Account...
                      </>
                    ) : (
                      <>
                        <Trash2 size={14} aria-hidden="true" /> Permanently Delete My Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
