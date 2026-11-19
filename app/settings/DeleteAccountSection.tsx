"use client";

import { useState, useTransition } from "react";
import {
  submitAccountDeletionRequest,
  cancelAccountDeletionRequest,
} from "@/app/actions/profile";
import {
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  LoaderCircle,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

type DeleteAccountSectionProps = {
  userRole: string;
  initialDeletionStatus?: string | null;
};

export default function DeleteAccountSection({
  userRole,
  initialDeletionStatus = null,
}: DeleteAccountSectionProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPendingCancel, startCancelTransition] = useTransition();

  const [deletionStatus, setDeletionStatus] = useState<string | null>(
    initialDeletionStatus
  );

  const isAdmin = userRole.toLowerCase().includes("admin");

  async function handleConfirmDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password) {
      setError("Password confirmation is required to verify your identity.");
      return;
    }

    if (!confirmedCheck) {
      setError("Please check the confirmation box acknowledging records retention.");
      return;
    }

    setLoading(true);

    try {
      const result = await submitAccountDeletionRequest(password, reason);

      if (!result.success) {
        setError(result.error || "Unable to submit account deletion request.");
        setLoading(false);
        return;
      }

      setDeletionStatus("pending");
      setIsModalOpen(false);
      setPassword("");
      setReason("");
      setConfirmedCheck(false);
      setSuccess(
        "Your account deletion request has been submitted for MENR review. Certain records are retained under municipal audit policies."
      );
      setLoading(false);
      router.refresh();
    } catch {
      setError("An unexpected error occurred while processing your request.");
      setLoading(false);
    }
  }

  function handleCancelRequest() {
    setError("");
    setSuccess("");
    startCancelTransition(async () => {
      const res = await cancelAccountDeletionRequest();
      if (!res.success) {
        setError(res.error || "Unable to cancel deletion request.");
        return;
      }
      setDeletionStatus(null);
      setSuccess("Your account deletion request has been successfully cancelled.");
      router.refresh();
    });
  }

  return (
    <div className="settings-danger-card">
      <div className="settings-section-header">
        <div className="settings-danger-icon">
          <Trash2 size={18} aria-hidden="true" />
        </div>
        <div>
          <h3 style={{ color: "#B91C1C" }}>Delete Account</h3>
          <p className="hint">
            You may request the deletion of your EcoGuard account. Certain complaint, permit, and official transaction records may need to be retained in accordance with applicable LGU policies and legal requirements.
          </p>
        </div>
      </div>

      {/* Municipal Records Retention Notice */}
      <div className="retention-policy-box">
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <ShieldAlert size={16} style={{ color: "#B45309", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ display: "block", color: "#92400E", fontSize: "12.5px", marginBottom: "4px" }}>
              Municipal Data Retention &amp; Legal Compliance Notice
            </strong>
            <p style={{ margin: 0, fontSize: "12px", color: "#78350F", lineHeight: 1.5 }}>
              In accordance with Philippine Republic Act No. 9003 (Ecological Solid Waste Management Act) and Presidential Decree No. 705 (Revised Forestry Code), all submitted environmental complaints, field inspection reports, and tree cutting permits are classified as official municipal records of Mabini, Batangas. Submitting a deletion request revokes resident portal credentials upon MENR review while legally mandating the non-destructive retention of historical public records.
            </p>
          </div>
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

      {/* Pending Request Status Banner */}
      {deletionStatus === "pending" && (
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FCD34D",
            borderRadius: "10px",
            padding: "14px 16px",
            marginTop: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <strong style={{ color: "#92400E", fontSize: "13px", display: "block" }}>
              Account Deletion Request Pending MENR Review
            </strong>
            <span style={{ color: "#B45309", fontSize: "12px" }}>
              Your deletion request has been received. Your portal access remains active until the municipal officer concludes the audit review.
            </span>
          </div>

          <button
            type="button"
            className="button secondary sm"
            onClick={handleCancelRequest}
            disabled={isPendingCancel}
          >
            {isPendingCancel ? (
              <LoaderCircle className="spin" size={13} aria-hidden="true" />
            ) : (
              <XCircle size={13} aria-hidden="true" />
            )}
            Cancel Request
          </button>
        </div>
      )}

      {isAdmin ? (
        <div className="notice warning sm" style={{ marginTop: "14px" }}>
          Administrator accounts cannot be self-deleted. Contact the Municipal Human Resources Office or Municipal Information Officer for credential decommissioning.
        </div>
      ) : (
        deletionStatus !== "pending" && (
          <div style={{ marginTop: "14px" }}>
            <button
              type="button"
              className="button danger-outline sm"
              onClick={() => {
                setIsModalOpen(true);
                setError("");
                setPassword("");
                setReason("");
                setConfirmedCheck(false);
              }}
            >
              <Trash2 size={14} aria-hidden="true" /> Request Account Deletion
            </button>
          </div>
        )
      )}

      {/* Confirmation Dialog / Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-card" style={{ maxWidth: "480px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#FEE2E2",
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 id="modal-title" style={{ margin: 0, fontSize: "16px", color: "var(--dark-forest)" }}>
                  Request Account Deletion
                </h3>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Review by MENR Mabini required prior to credential removal.
                </span>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 14px" }}>
              Submitting this request alerts the MENR Office to review your account. Once approved, your login credentials will be revoked. In accordance with municipal environmental policies, past complaints and permits remain on record.
            </p>

            <form onSubmit={handleConfirmDelete} noValidate>
              {/* Optional Reason */}
              <div className="form-field" style={{ marginBottom: "12px" }}>
                <label htmlFor="deletion-reason">
                  Reason for Deletion <span className="hint" style={{ fontSize: "11px" }}>(Optional)</span>
                </label>
                <input
                  id="deletion-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Relocated outside Mabini, no longer needed"
                  disabled={loading}
                  maxLength={150}
                />
              </div>

              {/* Password Verification */}
              <div className="form-field">
                <label htmlFor="deletion-password">
                  Confirm Password to Verify Identity <span aria-hidden="true">*</span>
                </label>
                <div className="password-input-wrap">
                  <input
                    id="deletion-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter your current account password"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <Eye size={17} aria-hidden="true" /> : <EyeOff size={17} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {/* Mandatory Checkbox */}
              <div style={{ margin: "14px 0" }}>
                <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", cursor: "pointer", fontSize: "12.5px" }}>
                  <input
                    type="checkbox"
                    checked={confirmedCheck}
                    onChange={(e) => {
                      setConfirmedCheck(e.target.checked);
                      if (error) setError("");
                    }}
                    disabled={loading}
                    style={{ width: "16px", height: "16px", marginTop: "2px", flexShrink: 0 }}
                  />
                  <span style={{ color: "var(--text-main)", lineHeight: 1.4 }}>
                    I understand that my account deletion request will be submitted for MENR review, and that official transaction and environmental complaint records will be retained pursuant to municipal governance laws.
                  </span>
                </label>
              </div>

              {error && (
                <div className="notice error sm" role="alert" style={{ marginBottom: "14px" }}>
                  <AlertCircle size={14} style={{ display: "inline-block", marginRight: "6px" }} />
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button danger sm"
                  disabled={loading || !password || !confirmedCheck}
                >
                  {loading ? (
                    <LoaderCircle className="spin" size={14} aria-hidden="true" />
                  ) : (
                    <Trash2 size={14} aria-hidden="true" />
                  )}
                  {loading ? "Submitting Request..." : "Request Account Deletion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
