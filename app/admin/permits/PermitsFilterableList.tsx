"use client";

import { useMemo, useState } from "react";
import PermitDocumentViewer from "./PermitDocumentViewer";
import PermitActions from "./PermitActions";
import SubmittedRequirements from "./SubmittedRequirements";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  TreePine,
  User,
  X,
} from "lucide-react";

type PermitApplication = {
  id: string;
  user_id: string | null;
  applicant_name: string;
  documentary_requirements: unknown;
  application_status: string;
  submitted_at: string | null;
  created_at?: string | null;
};

type PermitsFilterableListProps = {
  applications: PermitApplication[];
};

/**
 * Computes inclusive start and exclusive end timestamps (ms) for Asia/Manila (UTC+8).
 */
function getManilaDateRange(
  preset: string,
  customDateStr: string = ""
): { start: number; end: number } | null {
  const now = new Date();

  // Current calendar date in Asia/Manila as YYYY-MM-DD
  const manilaTodayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const [yStr, mStr] = manilaTodayStr.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);

  // Start of today in Asia/Manila (00:00:00+08:00)
  const todayStartMs = new Date(`${manilaTodayStr}T00:00:00+08:00`).getTime();

  if (preset === "TODAY") {
    return {
      start: todayStartMs,
      end: todayStartMs + 86400000,
    };
  }

  if (preset === "YESTERDAY") {
    return {
      start: todayStartMs - 86400000,
      end: todayStartMs,
    };
  }

  if (preset === "LAST_WEEK") {
    // Previous completed calendar week (Monday to Sunday) in Asia/Manila
    const dayStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      weekday: "short",
    }).format(now);
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(dayStr);
    const daysSinceMonday = (dayOfWeek + 6) % 7;

    const thisMondayStartMs = todayStartMs - daysSinceMonday * 86400000;
    const lastMondayStartMs = thisMondayStartMs - 7 * 86400000;

    return {
      start: lastMondayStartMs,
      end: thisMondayStartMs,
    };
  }

  if (preset === "LAST_MONTH") {
    // Previous completed calendar month in Asia/Manila
    let prevMonth = m - 1;
    let prevYear = y;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = y - 1;
    }
    const startIso = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01T00:00:00+08:00`;
    const endIso = `${y}-${String(m).padStart(2, "0")}-01T00:00:00+08:00`;
    return {
      start: new Date(startIso).getTime(),
      end: new Date(endIso).getTime(),
    };
  }

  if (preset === "CUSTOM" && customDateStr) {
    const startMs = new Date(`${customDateStr}T00:00:00+08:00`).getTime();
    return {
      start: startMs,
      end: startMs + 86400000,
    };
  }

  return null;
}

export default function PermitsFilterableList({
  applications,
}: PermitsFilterableListProps) {
  const [applicationsList, setApplicationsList] = useState(applications);
  const [prevApps, setPrevApps] = useState(applications);

  if (prevApps !== applications) {
    setPrevApps(applications);
    setApplicationsList(applications);
  }

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [datePreset, setDatePreset] = useState("ALL");
  const [customDate, setCustomDate] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function handlePermitStatusUpdate(id: string, newStatus: string) {
    setApplicationsList((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, application_status: newStatus } : app
      )
    );
  }

  const filteredApplications = useMemo(() => {
    return applicationsList.filter((app) => {
      // 1. Search Query: ID or Applicant Name
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesId = app.id.toLowerCase().includes(query);
        const matchesName = app.applicant_name?.toLowerCase().includes(query) ?? false;
        if (!matchesId && !matchesName) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "ALL") {
        const currentStatus = app.application_status.toLowerCase();
        const targetStatus = statusFilter.toLowerCase();
        if (targetStatus === "pending") {
          if (!currentStatus.includes("pending")) return false;
        } else if (currentStatus !== targetStatus) {
          return false;
        }
      }

      // 3. Date Filter (Asia/Manila, inclusive start & exclusive end)
      if (datePreset !== "ALL") {
        const rawDate = app.submitted_at || app.created_at;
        if (!rawDate) return false;

        const range = getManilaDateRange(datePreset, customDate);
        if (range) {
          const submittedMs = new Date(rawDate).getTime();
          if (isNaN(submittedMs)) return false;
          if (submittedMs < range.start || submittedMs >= range.end) {
            return false;
          }
        }
      }

      return true;
    });
  }, [applicationsList, searchTerm, statusFilter, datePreset, customDate]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "ALL" ||
    datePreset !== "ALL";

  function handleClearFilters() {
    setSearchTerm("");
    setStatusFilter("ALL");
    setDatePreset("ALL");
    setCustomDate("");
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Compact Filter Toolbar */}
      <div className="admin-compact-toolbar">
        <div className="admin-toolbar-main-row">
          {/* 1. Primary Text Search */}
          <div className="admin-toolbar-search">
            <span className="admin-toolbar-search-icon" aria-hidden="true">
              <Search size={15} />
            </span>
            <input
              id="permit-search"
              type="text"
              className="admin-toolbar-search-input"
              placeholder="Search applicant name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search permit applications"
            />
          </div>

          {/* 2. Primary Status Dropdown */}
          <select
            id="permit-status-filter"
            className="admin-toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by application status"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* 3. Primary Date Dropdown */}
          <select
            id="permit-date-filter"
            className="admin-toolbar-select"
            value={datePreset}
            onChange={(e) => {
              const val = e.target.value;
              setDatePreset(val);
              if (val !== "CUSTOM") {
                setCustomDate("");
              }
            }}
            aria-label="Filter by submission date"
            title="Filter by submission date"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="LAST_WEEK">Last Week</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="CUSTOM">Custom</option>
          </select>

          {/* 4. Single Custom Date Picker (Displayed ONLY when Custom is selected) */}
          {datePreset === "CUSTOM" && (
            <div className="admin-toolbar-date-wrapper" title="Select Date">
              <span className="admin-toolbar-date-icon" aria-hidden="true">
                <Calendar size={14} className="text-slate-600 dark:text-white" />
              </span>
              <input
                id="permit-custom-date"
                type="date"
                className="admin-toolbar-date-input"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                aria-label="Select Date"
                title="Select Date"
                placeholder="Select Date"
              />
              {customDate && (
                <button
                  type="button"
                  className="admin-toolbar-date-clear"
                  onClick={() => setCustomDate("")}
                  title="Clear selected date"
                  aria-label="Clear selected date"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {/* 5. Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="button outline filter-clear-btn"
              onClick={handleClearFilters}
              title="Reset all filters"
            >
              <RotateCcw size={13} aria-hidden="true" /> Reset
            </button>
          )}

          {/* 6. Record Count Badge */}
          <span className="admin-toolbar-count-badge">
            Showing {filteredApplications.length} of {applications.length}
          </span>
        </div>

        {/* Active Filter Chips */}
        {(statusFilter !== "ALL" || (datePreset !== "ALL" && (datePreset !== "CUSTOM" || customDate))) && (
          <div className="admin-filter-chips-row">
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>
              Active Filters:
            </span>
            {statusFilter !== "ALL" && (
              <span className="admin-filter-chip">
                Status: <strong>{statusFilter}</strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => setStatusFilter("ALL")}
                  title="Clear status filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {datePreset !== "ALL" && (
              <span className="admin-filter-chip">
                Date: <strong>
                  {datePreset === "CUSTOM"
                    ? customDate || "Select Date"
                    : datePreset === "TODAY"
                    ? "Today"
                    : datePreset === "YESTERDAY"
                    ? "Yesterday"
                    : datePreset === "LAST_WEEK"
                    ? "Last Week"
                    : "Last Month"}
                </strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => {
                    setDatePreset("ALL");
                    setCustomDate("");
                  }}
                  title="Clear date filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <section className="card empty-state" style={{ padding: "36px 20px", textAlign: "center" }}>
          <p style={{ color: "var(--dark-forest)", fontWeight: 600, fontSize: "15px", marginBottom: "6px" }}>
            No permit applications match the selected filter criteria.
          </p>
          <p className="hint" style={{ marginBottom: "16px" }}>
            Try clearing the search term, changing the status, or broadening the date range.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="button secondary"
              onClick={handleClearFilters}
              style={{ margin: "0 auto" }}
            >
              <RotateCcw size={14} aria-hidden="true" /> Reset All Filters
            </button>
          )}
        </section>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {filteredApplications.map((application) => {
            const isExpanded = expandedIds.has(application.id);

            return (
              <article
                key={application.id}
                className={`admin-record-card ${isExpanded ? "expanded" : ""}`}
              >
                {/* Header Row: Title, ID, and Status Badge */}
                <div className="admin-record-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span className="activity-icon permit">
                      <TreePine size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--dark-forest)" }}>
                        Tree Cutting Permit Application
                      </h2>
                      <span className="muted-id" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        ID: {application.id}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`badge ${application.application_status
                      .toLowerCase()
                      .replaceAll(" ", "-")}`}
                  >
                    {application.application_status}
                  </span>
                </div>

                {/* Summary Metadata Grid */}
                <div className="admin-record-summary-grid">
                  <div className="admin-record-meta-item">
                    <User size={14} color="var(--primary-green)" aria-hidden="true" />
                    <span>
                      Applicant: <strong>{application.applicant_name}</strong>
                    </span>
                  </div>

                  <div className="admin-record-meta-item">
                    <Calendar size={14} color="var(--primary-green)" aria-hidden="true" />
                    <span>
                      Submitted:{" "}
                      <strong>
                        {application.submitted_at
                          ? new Date(application.submitted_at).toLocaleDateString()
                          : "Date unavailable"}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Collapsed/Expanded Action Footer */}
                <div className="admin-record-card-footer">
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {isExpanded ? "Viewing attached requirements & permit review" : "Click to view documents & manage review"}
                  </span>

                  <button
                    type="button"
                    className={`admin-view-details-btn ${isExpanded ? "expanded" : ""}`}
                    onClick={() => toggleExpand(application.id)}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <>
                        <span>Hide Details</span>
                        <ChevronUp size={15} aria-hidden="true" />
                      </>
                    ) : (
                      <>
                        <span>View Details</span>
                        <ChevronDown size={15} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Details Pane */}
                {isExpanded && (
                  <div className="admin-expanded-details-pane">
                    {/* Unified Application Details & Status Row (Task 3) */}
                    <div className="admin-permit-unified-info-grid">
                      {/* Column 1: Full Applicant Name */}
                      <div className="admin-permit-info-col">
                        <span className="admin-permit-info-label">
                          Full Applicant Name
                        </span>
                        <strong className="admin-permit-info-value" style={{ color: "var(--dark-forest)" }}>
                          {application.applicant_name}
                        </strong>
                      </div>

                      {/* Column 2: Exact Submission Time */}
                      <div className="admin-permit-info-col">
                        <span className="admin-permit-info-label">
                          Exact Submission Time
                        </span>
                        <strong className="admin-permit-info-value" style={{ color: "var(--text-main)" }}>
                          {application.submitted_at
                            ? new Date(application.submitted_at).toLocaleString()
                            : "Unavailable"}
                        </strong>
                      </div>

                      {/* Column 3: Applicant User ID */}
                      <div className="admin-permit-info-col">
                        <span className="admin-permit-info-label">
                          Applicant User ID
                        </span>
                        <span className="admin-permit-info-value" style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>
                          {application.user_id || "Unlinked (Account Deleted)"}
                        </span>
                      </div>

                      {/* Column 4: Update Application Status */}
                      <div className="admin-permit-info-col status-col">
                        <PermitActions
                          applicationId={application.id}
                          requirements={application.documentary_requirements}
                          currentStatus={
                            application.application_status === "Pending" ||
                            application.application_status === "Under Review" ||
                            application.application_status === "Approved" ||
                            application.application_status === "Rejected"
                              ? application.application_status
                              : "Pending"
                          }
                          onStatusChange={(newStatus) => handlePermitStatusUpdate(application.id, newStatus)}
                        />
                      </div>
                    </div>

                    {/* Documentary Requirements Checklist */}
                    <SubmittedRequirements
                      requirements={application.documentary_requirements}
                    />

                    {/* Permit Document Viewer */}
                    <PermitDocumentViewer
                      applicationId={application.id}
                      requirements={application.documentary_requirements}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
