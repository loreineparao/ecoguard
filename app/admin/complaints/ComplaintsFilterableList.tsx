"use client";

import { useMemo, useState } from "react";
import ComplaintActions from "./ComplaintActions";
import EvidenceViewer from "./EvidenceViewer";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  MapPin,
  MessageSquare,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserCheck,
  X,
} from "lucide-react";

type ComplaintItem = {
  id: string;
  user_id: string;
  category: string;
  description: string;
  status: string;
  assigned_personnel: string | null;
  created_at: string;
  address?: string | null;
};

type ComplaintsFilterableListProps = {
  complaints: ComplaintItem[];
};

export default function ComplaintsFilterableList({
  complaints,
}: ComplaintsFilterableListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("");
  const [inspectorFilter, setInspectorFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Extract distinct categories from data
  const distinctCategories = useMemo(() => {
    const set = new Set<string>();
    complaints.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [complaints]);

  // Filter complaints based on multiple combined criteria
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      // 1. Text Search: ID, description, or assigned personnel
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesId = item.id.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query) ?? false;
        const matchesAssigned = item.assigned_personnel?.toLowerCase().includes(query) ?? false;
        if (!matchesId && !matchesDesc && !matchesAssigned) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "ALL") {
        if (item.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // 3. Category Filter
      if (categoryFilter !== "ALL") {
        if (item.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }

      // 4. Location / Barangay Filter
      if (locationFilter.trim()) {
        const locQuery = locationFilter.toLowerCase().trim();
        const address = (item.address || "").toLowerCase();
        const desc = (item.description || "").toLowerCase();
        if (!address.includes(locQuery) && !desc.includes(locQuery)) return false;
      }

      // 5. Assigned Inspector Filter
      if (inspectorFilter.trim()) {
        const inspQuery = inspectorFilter.toLowerCase().trim();
        const inspector = (item.assigned_personnel || "").toLowerCase();
        if (!inspector.includes(inspQuery)) return false;
      }

      // 6. Submission Date Range Filter
      if (startDate) {
        const itemDate = new Date(item.created_at);
        const start = new Date(`${startDate}T00:00:00`);
        if (itemDate < start) return false;
      }

      if (endDate) {
        const itemDate = new Date(item.created_at);
        const end = new Date(`${endDate}T23:59:59.999`);
        if (itemDate > end) return false;
      }

      return true;
    });
  }, [
    complaints,
    searchTerm,
    statusFilter,
    categoryFilter,
    locationFilter,
    inspectorFilter,
    startDate,
    endDate,
  ]);

  const secondaryFilterCount =
    (categoryFilter !== "ALL" ? 1 : 0) +
    (locationFilter.trim() !== "" ? 1 : 0) +
    (inspectorFilter.trim() !== "" ? 1 : 0) +
    (startDate !== "" ? 1 : 0) +
    (endDate !== "" ? 1 : 0);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "ALL" ||
    secondaryFilterCount > 0;

  function handleClearFilters() {
    setSearchTerm("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setLocationFilter("");
    setInspectorFilter("");
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
              id="complaint-search"
              type="text"
              className="admin-toolbar-search-input"
              placeholder="Search by ID, keyword, personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search complaints"
            />
          </div>

          {/* 2. Primary Status Dropdown */}
          <select
            id="complaint-status-filter"
            className="admin-toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Resolved">Resolved</option>
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
            title="Toggle more filters"
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            <span>Filters</span>
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
            Showing {filteredComplaints.length} of {complaints.length}
          </span>
        </div>

        {/* Collapsible Drawer for Secondary Filters */}
        {showAdvancedFilters && (
          <div className="admin-filter-drawer">
            <div className="filter-toolbar-grid">
              {/* Category */}
              <div className="filter-field">
                <label htmlFor="complaint-category-filter">Category</label>
                <select
                  id="complaint-category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  <option value="Illegal Dumping">Illegal Dumping</option>
                  {distinctCategories
                    .filter((cat) => cat !== "Illegal Dumping")
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              {/* Barangay / Location */}
              <div className="filter-field">
                <label htmlFor="complaint-location-filter">
                  <MapPin size={12} aria-hidden="true" /> Location / Barangay
                </label>
                <input
                  id="complaint-location-filter"
                  type="text"
                  placeholder="e.g. Anilao, Poblacion..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>

              {/* Assigned Inspector */}
              <div className="filter-field">
                <label htmlFor="complaint-inspector-filter">
                  <UserCheck size={12} aria-hidden="true" /> Assigned Inspector
                </label>
                <input
                  id="complaint-inspector-filter"
                  type="text"
                  placeholder="Personnel name..."
                  value={inspectorFilter}
                  onChange={(e) => setInspectorFilter(e.target.value)}
                />
              </div>

              {/* Date From */}
              <div className="filter-field">
                <label htmlFor="complaint-start-date">
                  <Calendar size={12} aria-hidden="true" /> From Date
                </label>
                <input
                  id="complaint-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* Date To */}
              <div className="filter-field">
                <label htmlFor="complaint-end-date">
                  <Calendar size={12} aria-hidden="true" /> To Date
                </label>
                <input
                  id="complaint-end-date"
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
            {categoryFilter !== "ALL" && (
              <span className="admin-filter-chip">
                Category: <strong>{categoryFilter}</strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => setCategoryFilter("ALL")}
                  title="Remove category filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {locationFilter.trim() !== "" && (
              <span className="admin-filter-chip">
                Location: <strong>{locationFilter}</strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => setLocationFilter("")}
                  title="Remove location filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {inspectorFilter.trim() !== "" && (
              <span className="admin-filter-chip">
                Inspector: <strong>{inspectorFilter}</strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => setInspectorFilter("")}
                  title="Remove inspector filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
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

      {/* Results List */}
      {filteredComplaints.length === 0 ? (
        <section className="card empty-state" style={{ padding: "36px 20px", textAlign: "center" }}>
          <p style={{ color: "var(--dark-forest)", fontWeight: 600, fontSize: "15px", marginBottom: "6px" }}>
            No complaints match the selected filter criteria.
          </p>
          <p className="hint" style={{ marginBottom: "16px" }}>
            Try adjusting your search terms, status, category, or date range.
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
          {filteredComplaints.map((complaint) => {
            const isExpanded = expandedIds.has(complaint.id);

            return (
              <article
                key={complaint.id}
                className={`admin-record-card ${isExpanded ? "expanded" : ""}`}
              >
                {/* Header Row: Category, ID, and Status Badge */}
                <div className="admin-record-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span className="activity-icon complaint">
                      <MessageSquare size={17} aria-hidden="true" />
                    </span>
                    <div>
                      <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--dark-forest)" }}>
                        {complaint.category}
                      </h2>
                      <span className="muted-id" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        ID: {complaint.id}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`badge ${complaint.status
                      .toLowerCase()
                      .replaceAll(" ", "-")}`}
                  >
                    {complaint.status}
                  </span>
                </div>

                {/* Short Preview Description */}
                {!isExpanded && complaint.description && (
                  <p className="admin-record-preview-text">
                    {complaint.description}
                  </p>
                )}

                {/* Summary Metadata Grid */}
                <div className="admin-record-summary-grid">
                  {complaint.address && (
                    <div className="admin-record-meta-item">
                      <MapPin size={14} color="var(--primary-green)" aria-hidden="true" />
                      <span>
                        Location: <strong>{complaint.address}</strong>
                      </span>
                    </div>
                  )}

                  <div className="admin-record-meta-item">
                    <Calendar size={14} color="var(--primary-green)" aria-hidden="true" />
                    <span>
                      Submitted: <strong>{new Date(complaint.created_at).toLocaleDateString()}</strong>
                    </span>
                  </div>

                  <div className="admin-record-meta-item">
                    <UserCheck size={14} color="var(--primary-green)" aria-hidden="true" />
                    <span>
                      Inspector: <strong>{complaint.assigned_personnel || "Unassigned"}</strong>
                    </span>
                  </div>
                </div>

                {/* Collapsed/Expanded Action Footer */}
                <div className="admin-record-card-footer">
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {isExpanded ? "Viewing complete details & administrative actions" : "Click to view evidence & manage"}
                  </span>

                  <button
                    type="button"
                    className={`admin-view-details-btn ${isExpanded ? "expanded" : ""}`}
                    onClick={() => toggleExpand(complaint.id)}
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
                    {/* Full Description */}
                    <div style={{ marginBottom: "16px" }}>
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          display: "block",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        Full Concern Description
                      </span>
                      <p style={{ margin: 0, lineHeight: 1.6, color: "var(--text-main)", fontSize: "14px" }}>
                        {complaint.description}
                      </p>
                    </div>

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
                          Full Date & Time Submitted
                        </span>
                        <strong style={{ color: "var(--text-main)" }}>
                          {new Date(complaint.created_at).toLocaleString()}
                        </strong>
                      </div>

                      <div>
                        <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                          Resident Account ID
                        </span>
                        <span style={{ color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "12px" }}>
                          {complaint.user_id}
                        </span>
                      </div>

                      <div>
                        <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                          Assigned Inspector
                        </span>
                        <strong style={{ color: "var(--dark-forest)" }}>
                          {complaint.assigned_personnel || "Not yet assigned"}
                        </strong>
                      </div>
                    </div>

                    {/* Evidence Viewer */}
                    <EvidenceViewer complaintId={complaint.id} />

                    {/* Complaint Actions (Status update, dispatch, personnel assignment) */}
                    <ComplaintActions
                      complaintId={complaint.id}
                      currentStatus={
                        complaint.status === "Pending" ||
                        complaint.status === "Under Review" ||
                        complaint.status === "Dispatched" ||
                        complaint.status === "Resolved"
                          ? complaint.status
                          : "Pending"
                      }
                      currentAssignedPersonnel={complaint.assigned_personnel}
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
