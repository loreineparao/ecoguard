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
  SlidersHorizontal,
  TreePine,
  User,
  X,
} from "lucide-react";

type PermitApplication = {
  id: string;
  user_id: string;
  applicant_name: string;
  documentary_requirements: unknown;
  application_status: string;
  submitted_at: string | null;
};

type PermitsFilterableListProps = {
  applications: PermitApplication[];
};

export default function PermitsFilterableList({
  applications,
}: PermitsFilterableListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
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

      // 3. Date Range Filter
      if (app.submitted_at) {
        const submittedDate = new Date(app.submitted_at);
        if (startDate) {
          const start = new Date(`${startDate}T00:00:00`);
          if (submittedDate < start) return false;
        }
        if (endDate) {
          const end = new Date(`${endDate}T23:59:59.999`);
          if (submittedDate > end) return false;
        }
      } else if (startDate || endDate) {
        return false;
      }

      return true;
    });
  }, [applications, searchTerm, statusFilter, startDate, endDate]);

  const secondaryFilterCount =
    (startDate !== "" ? 1 : 0) + (endDate !== "" ? 1 : 0);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "ALL" ||
    secondaryFilterCount > 0;

  function handleClearFilters() {
    setSearchTerm("");
    setStatusFilter("ALL");
    setStartDate("");
    setEndDate("");
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

          {/* 3. Expandable Filters Toggle Button */}
          <button
            type="button"
            className={`admin-toolbar-toggle-btn ${
              secondaryFilterCount > 0 || showAdvancedFilters ? "active" : ""
            }`}
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            aria-expanded={showAdvancedFilters}
            title="Toggle date range filters"
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            <span>Dates</span>
            {secondaryFilterCount > 0 && (
              <span className="admin-active-count-badge">
                {secondaryFilterCount}
              </span>
            )}
            {showAdvancedFilters ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </button>

          {/* 4. Reset Filters Button */}
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

          {/* 5. Record Count Badge */}
          <span className="admin-toolbar-count-badge">
            Showing {filteredApplications.length} of {applications.length}
          </span>
        </div>

        {/* Collapsible Drawer for Secondary Filters (Date Range) */}
        {showAdvancedFilters && (
          <div className="admin-filter-drawer">
            <div className="filter-toolbar-grid">
              <div className="filter-field">
                <label htmlFor="permit-start-date">
                  <Calendar size={12} aria-hidden="true" /> Submitted From Date
                </label>
                <input
                  id="permit-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="permit-end-date">
                  <Calendar size={12} aria-hidden="true" /> Submitted To Date
                </label>
                <input
                  id="permit-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Secondary Filter Chips */}
        {secondaryFilterCount > 0 && (
          <div className="admin-filter-chips-row">
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>
              Active Filters:
            </span>
            {startDate !== "" && (
              <span className="admin-filter-chip">
                From: <strong>{startDate}</strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => setStartDate("")}
                  title="Remove start date"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {endDate !== "" && (
              <span className="admin-filter-chip">
                To: <strong>{endDate}</strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => setEndDate("")}
                  title="Remove end date"
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
                    {/* Extended Technical Details */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "12px",
                        padding: "12px 14px",
                        background: "#F8FAFC",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        marginBottom: "16px",
                        fontSize: "13px",
                      }}
                    >
                      <div>
                        <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                          Full Applicant Name
                        </span>
                        <strong style={{ color: "var(--dark-forest)" }}>
                          {application.applicant_name}
                        </strong>
                      </div>

                      <div>
                        <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                          Exact Submission Time
                        </span>
                        <strong style={{ color: "var(--text-main)" }}>
                          {application.submitted_at
                            ? new Date(application.submitted_at).toLocaleString()
                            : "Unavailable"}
                        </strong>
                      </div>

                      <div>
                        <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                          Applicant User ID
                        </span>
                        <span style={{ color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "12px" }}>
                          {application.user_id}
                        </span>
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

                    {/* Permit Actions (Review status, remarks, approval) */}
                    <PermitActions
                      applicationId={application.id}
                      currentStatus={
                        application.application_status === "Pending" ||
                        application.application_status === "Under Review" ||
                        application.application_status === "Approved" ||
                        application.application_status === "Rejected"
                          ? application.application_status
                          : "Pending"
                      }
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
