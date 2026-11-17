"use client";

import { useState } from "react";
import { updateComplaintStatus } from "@/app/actions/complaint-status";
import { dispatchComplaint } from "@/app/actions/dispatch-complaint";
import { LoaderCircle, Send, Check } from "lucide-react";

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
      setError("Please enter the assigned personnel name.");
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
        borderTop: "1px solid var(--border)",
      }}
    >
      <h3 style={{ color: "var(--dark-forest)", fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>
        MENR Administrative Actions
      </h3>

      <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {/* Status Dropdown */}
        <div className="form-field">
          <label htmlFor={`status-${complaintId}`}>
            Update Status
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
          >
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {/* Assigned Personnel */}
        <div className="form-field">
          <label htmlFor={`personnel-${complaintId}`}>
            Assigned Personnel
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id={`personnel-${complaintId}`}
              type="text"
              value={assignedPersonnel}
              disabled={loading}
              onChange={(event) =>
                setAssignedPersonnel(event.target.value)
              }
              placeholder="e.g. Officer Santos"
            />
            <button
              type="button"
              className="button green"
              onClick={handleDispatch}
              disabled={loading}
              title="Assign personnel & mark dispatched"
            >
              {loading ? (
                <LoaderCircle className="spin" size={15} aria-hidden="true" />
              ) : (
                <Send size={15} aria-hidden="true" />
              )}
              Dispatch
            </button>
          </div>
        </div>
      </div>

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
