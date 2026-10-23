"use client";

import { useState } from "react";
import { updateComplaintStatus } from "@/app/actions/complaint-status";
import { dispatchComplaint } from "@/app/actions/dispatch-complaint";

type ComplaintActionsProps = {
  complaintId: string;
  currentStatus:
    | "Pending"
    | "Under Review"
    | "Dispatched"
    | "Resolved";
  currentAssignedPersonnel: string | null;
};

export default function ComplaintActions({
  complaintId,
  currentStatus,
  currentAssignedPersonnel,
}: ComplaintActionsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [assignedPersonnel, setAssignedPersonnel] = useState(
    currentAssignedPersonnel ?? ""
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleStatusChange(
    newStatus:
      | "Pending"
      | "Under Review"
      | "Dispatched"
      | "Resolved"
  ) {
    setLoading(true);
    setMessage("");
    setError("");

    const result = await updateComplaintStatus(
      complaintId,
      newStatus
    );

    if (!result.success) {
      setError(
        result.error ?? "Unable to update complaint status."
      );
      setLoading(false);
      return;
    }

    setStatus(newStatus);
    setMessage(
      `Complaint status changed to "${newStatus}".`
    );

    setLoading(false);
  }

  async function handleDispatch() {
    setLoading(true);
    setMessage("");
    setError("");

    if (!assignedPersonnel.trim()) {
      setError("Please enter the assigned personnel.");
      setLoading(false);
      return;
    }

    const result = await dispatchComplaint(
      complaintId,
      assignedPersonnel.trim()
    );

    if (!result.success) {
      setError(
        result.error ?? "Unable to dispatch complaint."
      );
      setLoading(false);
      return;
    }

    setStatus("Dispatched");

    setMessage(
      `Complaint dispatched to ${assignedPersonnel.trim()}.`
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

      {/* Status */}

      <label
        htmlFor={`status-${complaintId}`}
        style={{
          display: "block",
          fontWeight: "600",
          marginBottom: "8px",
        }}
      >
        Complaint Status
      </label>

      <select
        id={`status-${complaintId}`}
        value={status}
        disabled={loading}
        onChange={(event) =>
          handleStatusChange(
            event.target.value as
              | "Pending"
              | "Under Review"
              | "Dispatched"
              | "Resolved"
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
        <option value="Dispatched">Dispatched</option>
        <option value="Resolved">Resolved</option>
      </select>

      {/* Assigned Personnel */}

      <label
        htmlFor={`personnel-${complaintId}`}
        style={{
          display: "block",
          fontWeight: "600",
          marginTop: "15px",
          marginBottom: "8px",
        }}
      >
        Assigned Personnel
      </label>

      <input
        id={`personnel-${complaintId}`}
        type="text"
        value={assignedPersonnel}
        disabled={loading}
        onChange={(event) =>
          setAssignedPersonnel(event.target.value)
        }
        placeholder="Enter MENR personnel name"
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxSizing: "border-box",
        }}
      />

      {/* Dispatch */}

      <button
        type="button"
        onClick={handleDispatch}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: "12px",
          padding: "12px",
          border: "none",
          borderRadius: "8px",
          background: loading ? "#999" : "#2563eb",
          color: "white",
          fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Processing..." : "Assign & Dispatch"}
      </button>

      {/* Messages */}

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