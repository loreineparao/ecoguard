"use client";

import { useState } from "react";
import { updatePermitStatus } from "@/app/actions/permit-status";
import { Check, LoaderCircle, AlertCircle } from "lucide-react";

type PermitStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected";

type PermitActionsProps = {
  applicationId: string;
  currentStatus: PermitStatus;
  requirements?: unknown;
  onStatusChange?: (newStatus: PermitStatus) => void;
};

export default function PermitActions({
  applicationId,
  currentStatus,
  requirements,
  onStatusChange,
}: PermitActionsProps) {
  const [status, setStatus] = useState<PermitStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleStatusChange(newStatus: PermitStatus) {
    if (newStatus === status) return;

    setLoading(true);
    setMessage("");
    setError("");

    // Frontend validation: Check Resolution Interposing No Objection requirement before approving
    if (newStatus === "Approved" && requirements && typeof requirements === "object") {
      const reqObj = requirements as Record<string, unknown>;
      const hasReq =
        reqObj.no_objection === "submitted" ||
        reqObj.resolution_no_objection === "submitted" ||
        reqObj.resolution_interposing_no_objection === "submitted" ||
        reqObj.no_objection === true ||
        reqObj.resolution_no_objection === true;

      if (!hasReq) {
        setError(
          "Resolution Interposing No Objection is required before this permit can be approved."
        );
        setLoading(false);
        return;
      }
    }

    const result = await updatePermitStatus(applicationId, newStatus);

    if (!result.success) {
      setError(result.error ?? "Unable to update permit status.");
      setLoading(false);
      return;
    }

    setStatus(newStatus);
    setMessage(`Status updated to "${newStatus}".`);
    setLoading(false);

    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  }

  return (
    <div className="admin-permit-status-control-inner">
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label
          htmlFor={`permit-status-${applicationId}`}
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            color: "var(--text-secondary)",
          }}
        >
          Update Application Status
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            id={`permit-status-${applicationId}`}
            className="admin-toolbar-select"
            value={status}
            disabled={loading}
            onChange={(event) =>
              handleStatusChange(event.target.value as PermitStatus)
            }
            style={{
              height: "38px",
              minWidth: "160px",
              fontWeight: 600,
            }}
          >
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {loading && (
            <LoaderCircle
              className="spin"
              size={16}
              color="var(--primary-green)"
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {error && (
        <div
          className="notice error"
          role="alert"
          style={{
            marginTop: "8px",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            padding: "8px 12px",
            maxWidth: "340px",
          }}
        >
          <AlertCircle
            size={15}
            style={{ flexShrink: 0, marginTop: "2px", color: "#DC2626" }}
            aria-hidden="true"
          />
          <span style={{ fontSize: "12px", lineHeight: "1.4" }}>{error}</span>
        </div>
      )}

      {message && (
        <div
          className="notice success"
          role="status"
          style={{
            marginTop: "8px",
            padding: "6px 12px",
            fontSize: "12px",
            maxWidth: "340px",
          }}
        >
          <Check size={13} style={{ display: "inline-block", marginRight: "6px" }} />
          {message}
        </div>
      )}
    </div>
  );
}
