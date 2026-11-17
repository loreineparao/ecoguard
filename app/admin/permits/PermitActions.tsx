"use client";

import { useState } from "react";
import { updatePermitStatus } from "@/app/actions/permit-status";
import { Check, LoaderCircle } from "lucide-react";

type PermitStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected";

type PermitActionsProps = {
  applicationId: string;
  currentStatus: PermitStatus;
};

export default function PermitActions({
  applicationId,
  currentStatus,
}: PermitActionsProps) {
  const [status, setStatus] = useState<PermitStatus>(
    currentStatus
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleStatusChange(
    newStatus: PermitStatus
  ) {
    setLoading(true);
    setMessage("");
    setError("");

    const result = await updatePermitStatus(
      applicationId,
      newStatus
    );

    if (!result.success) {
      setError(
        result.error ?? "Unable to update permit status."
      );
      setLoading(false);
      return;
    }

    setStatus(newStatus);

    setMessage(
      `Permit application status changed to "${newStatus}".`
    );

    setLoading(false);
  }

  return (
    <div
      style={{
        marginTop: "20px",
        paddingTop: "20px",
        borderTop: "1px solid var(--border)",
      }}
    >
      <h3 style={{ color: "var(--dark-forest)", fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>
        MENR Application Evaluation
      </h3>

      <div className="form-field" style={{ maxWidth: "320px" }}>
        <label htmlFor={`permit-status-${applicationId}`}>
          Update Application Status
        </label>

        <select
          id={`permit-status-${applicationId}`}
          value={status}
          disabled={loading}
          onChange={(event) =>
            handleStatusChange(
              event.target.value as PermitStatus
            )
          }
        >
          <option value="Pending">Pending</option>
          <option value="Under Review">Under Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {loading && (
        <p className="hint" style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
          <LoaderCircle className="spin" size={14} aria-hidden="true" />
          Updating application status...
        </p>
      )}

      {error && (
        <div className="notice error" role="alert" style={{ marginTop: "12px" }}>
          {error}
        </div>
      )}

      {message && (
        <div className="notice success" role="status" style={{ marginTop: "12px" }}>
          <Check size={14} style={{ display: "inline-block", marginRight: "6px" }} />
          {message}
        </div>
      )}
    </div>
  );
}
