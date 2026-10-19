"use client";

import { useState } from "react";
import { updatePermitStatus } from "@/app/actions/permit-status";

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
        borderTop: "1px solid #eee",
      }}
    >
      <h3 style={{ marginBottom: "15px" }}>
        MENR Actions
      </h3>

      <label
        htmlFor={`permit-status-${applicationId}`}
        style={{
          display: "block",
          fontWeight: "600",
          marginBottom: "8px",
        }}
      >
        Application Status
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
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          background: "white",
        }}
      >
        <option value="Pending">Pending</option>
        <option value="Under Review">Under Review</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
      </select>

      {error && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "8px",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}