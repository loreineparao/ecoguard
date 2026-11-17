"use client";

import { useMemo, useState } from "react";
import TripTicketActions from "./TripTicketActions";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Truck,
  User,
  X,
} from "lucide-react";

type Schedule = {
  id: string;
  barangay: string;
  collection_time: string;
  truck_id: string | null;
  driver_id: string | null;
};

type TripTicket = {
  id: string;
  schedule_id: string;
  estimated_load: string | null;
  actual_collection_time: string | null;
  driver_name: string;
  plate_number: string;
  created_at: string;
  barangay?: string;
};

type TripTicketsFilterableListProps = {
  tickets: TripTicket[];
  schedules: Schedule[];
};

export default function TripTicketsFilterableList({
  tickets,
  schedules,
}: TripTicketsFilterableListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [driverFilter, setDriverFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Map schedules by id for fast lookup
  const scheduleMap = useMemo(() => {
    const map = new Map<string, Schedule>();
    schedules.forEach((s) => map.set(s.id, s));
    return map;
  }, [schedules]);

  // Distinct barangays from schedules
  const distinctBarangays = useMemo(() => {
    const set = new Set<string>();
    schedules.forEach((s) => {
      if (s.barangay) set.add(s.barangay);
    });
    return Array.from(set).sort();
  }, [schedules]);

  // Combined filtering
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const schedule = scheduleMap.get(ticket.schedule_id);
      const barangay = ticket.barangay || schedule?.barangay || "";
      const isCompleted = Boolean(ticket.actual_collection_time);

      // 1. Search Query: ID, driver, or plate
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesId = ticket.id.toLowerCase().includes(query);
        const matchesDriver = ticket.driver_name?.toLowerCase().includes(query) ?? false;
        const matchesPlate = ticket.plate_number?.toLowerCase().includes(query) ?? false;
        if (!matchesId && !matchesDriver && !matchesPlate) return false;
      }

      // 2. Status Filter
      if (statusFilter === "COMPLETED" && !isCompleted) return false;
      if (statusFilter === "PENDING" && isCompleted) return false;

      // 3. Driver Filter
      if (driverFilter.trim()) {
        const dQuery = driverFilter.toLowerCase().trim();
        if (!ticket.driver_name?.toLowerCase().includes(dQuery)) return false;
      }

      // 4. Vehicle / Plate Filter
      if (vehicleFilter.trim()) {
        const vQuery = vehicleFilter.toLowerCase().trim();
        if (!ticket.plate_number?.toLowerCase().includes(vQuery)) return false;
      }

      // 5. Barangay Filter
      if (barangayFilter !== "ALL") {
        if (barangay.toLowerCase() !== barangayFilter.toLowerCase()) return false;
      }

      // 6. Collection / Creation Date Range
      const effectiveDateStr = ticket.actual_collection_time || ticket.created_at;
      if (effectiveDateStr) {
        const ticketDate = new Date(effectiveDateStr);
        if (startDate) {
          const start = new Date(`${startDate}T00:00:00`);
          if (ticketDate < start) return false;
        }
        if (endDate) {
          const end = new Date(`${endDate}T23:59:59.999`);
          if (ticketDate > end) return false;
        }
      } else if (startDate || endDate) {
        return false;
      }

      return true;
    });
  }, [
    tickets,
    scheduleMap,
    searchTerm,
    statusFilter,
    driverFilter,
    vehicleFilter,
    barangayFilter,
    startDate,
    endDate,
  ]);

  const secondaryFilterCount =
    (driverFilter.trim() !== "" ? 1 : 0) +
    (vehicleFilter.trim() !== "" ? 1 : 0) +
    (barangayFilter !== "ALL" ? 1 : 0) +
    (startDate !== "" ? 1 : 0) +
    (endDate !== "" ? 1 : 0);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "ALL" ||
    secondaryFilterCount > 0;

  function handleClearFilters() {
    setSearchTerm("");
    setStatusFilter("ALL");
    setDriverFilter("");
    setVehicleFilter("");
    setBarangayFilter("ALL");
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
              id="ticket-search"
              type="text"
              className="admin-toolbar-search-input"
              placeholder="Search by ticket ID, driver, or plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search trip tickets"
            />
          </div>

          {/* 2. Primary Status Dropdown */}
          <select
            id="ticket-status-filter"
            className="admin-toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by trip status"
          >
            <option value="ALL">All Trips</option>
            <option value="COMPLETED">Completed Collection</option>
            <option value="PENDING">Pending Collection</option>
          </select>

          {/* 3. Expandable Filters Toggle Button */}
          <button
            type="button"
            className={`admin-toolbar-toggle-btn ${
              secondaryFilterCount > 0 || showAdvancedFilters ? "active" : ""
            }`}
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            aria-expanded={showAdvancedFilters}
            title="Toggle driver, vehicle, and date filters"
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
            Showing {filteredTickets.length} of {tickets.length}
          </span>
        </div>

        {/* Collapsible Drawer for Secondary Filters */}
        {showAdvancedFilters && (
          <div className="admin-filter-drawer">
            <div className="filter-toolbar-grid">
              {/* Driver */}
              <div className="filter-field">
                <label htmlFor="ticket-driver-filter">
                  <User size={12} aria-hidden="true" /> Assigned Driver
                </label>
                <input
                  id="ticket-driver-filter"
                  type="text"
                  placeholder="Driver name..."
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                />
              </div>

              {/* Vehicle Plate */}
              <div className="filter-field">
                <label htmlFor="ticket-vehicle-filter">
                  <Truck size={12} aria-hidden="true" /> Vehicle Plate No.
                </label>
                <input
                  id="ticket-vehicle-filter"
                  type="text"
                  placeholder="e.g. SAA-1234..."
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                />
              </div>

              {/* Barangay */}
              <div className="filter-field">
                <label htmlFor="ticket-barangay-filter">
                  <MapPin size={12} aria-hidden="true" /> Barangay
                </label>
                <select
                  id="ticket-barangay-filter"
                  value={barangayFilter}
                  onChange={(e) => setBarangayFilter(e.target.value)}
                >
                  <option value="ALL">All Barangays</option>
                  {distinctBarangays.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="filter-field">
                <label htmlFor="ticket-start-date">
                  <Calendar size={12} aria-hidden="true" /> From Date
                </label>
                <input
                  id="ticket-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* End Date */}
              <div className="filter-field">
                <label htmlFor="ticket-end-date">
                  <Calendar size={12} aria-hidden="true" /> To Date
                </label>
                <input
                  id="ticket-end-date"
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
            {driverFilter.trim() !== "" && (
              <span className="admin-filter-chip">
                Driver: <strong>{driverFilter}</strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => setDriverFilter("")}
                  title="Remove driver filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {vehicleFilter.trim() !== "" && (
              <span className="admin-filter-chip">
                Plate: <strong>{vehicleFilter}</strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => setVehicleFilter("")}
                  title="Remove plate filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {barangayFilter !== "ALL" && (
              <span className="admin-filter-chip">
                Barangay: <strong>{barangayFilter}</strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => setBarangayFilter("ALL")}
                  title="Remove barangay filter"
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

      {/* Trip Tickets List */}
      {filteredTickets.length === 0 ? (
        <section className="card empty-state" style={{ padding: "36px 20px", textAlign: "center" }}>
          <p style={{ color: "var(--dark-forest)", fontWeight: 600, fontSize: "15px", marginBottom: "6px" }}>
            No trip tickets match the selected filter criteria.
          </p>
          <p className="hint" style={{ marginBottom: "16px" }}>
            Try adjusting driver, vehicle plate, barangay, or collection dates.
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
          {filteredTickets.map((ticket) => {
            const schedule = scheduleMap.get(ticket.schedule_id);
            const barangay = ticket.barangay || schedule?.barangay || "Mabini Area";
            const isCompleted = Boolean(ticket.actual_collection_time);
            const isExpanded = expandedIds.has(ticket.id);

            return (
              <article
                key={ticket.id}
                className={`admin-record-card ${isExpanded ? "expanded" : ""}`}
              >
                {/* Header Row: Title, ID, and Status Badge */}
                <div className="admin-record-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span className="activity-icon" style={{ background: "#E0F2FE", color: "#0284C7" }}>
                      <Truck size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--dark-forest)" }}>
                        Trip Ticket: {ticket.plate_number}
                      </h2>
                      <span className="muted-id" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        ID: {ticket.id}
                      </span>
                    </div>
                  </div>

                  <span className={`badge ${isCompleted ? "resolved" : "pending"}`}>
                    {isCompleted ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle2 size={12} aria-hidden="true" /> Completed
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} aria-hidden="true" /> Pending
                      </span>
                    )}
                  </span>
                </div>

                {/* Summary Metadata Grid */}
                <div className="admin-record-summary-grid">
                  <div className="admin-record-meta-item">
                    <MapPin size={14} color="var(--primary-green)" aria-hidden="true" />
                    <span>
                      Area: <strong>{barangay}</strong>
                    </span>
                  </div>

                  <div className="admin-record-meta-item">
                    <User size={14} color="var(--primary-green)" aria-hidden="true" />
                    <span>
                      Driver: <strong>{ticket.driver_name}</strong>
                    </span>
                  </div>

                  <div className="admin-record-meta-item">
                    <Truck size={14} color="var(--primary-green)" aria-hidden="true" />
                    <span>
                      Plate: <strong>{ticket.plate_number}</strong>
                    </span>
                  </div>

                  <div className="admin-record-meta-item">
                    <Clock size={14} color="var(--primary-green)" aria-hidden="true" />
                    <span>
                      Status:{" "}
                      <strong>
                        {isCompleted
                          ? `Collected ${new Date(ticket.actual_collection_time!).toLocaleDateString()}`
                          : "Awaiting Collection"}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Collapsed/Expanded Action Footer */}
                <div className="admin-record-card-footer">
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {isExpanded ? "Viewing trip details & ticket management" : "Click to view logs & record collection"}
                  </span>

                  <button
                    type="button"
                    className={`admin-view-details-btn ${isExpanded ? "expanded" : ""}`}
                    onClick={() => toggleExpand(ticket.id)}
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
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
                          Barangay Route
                        </span>
                        <strong style={{ color: "var(--dark-forest)" }}>
                          {barangay}
                        </strong>
                      </div>

                      <div>
                        <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                          Driver Name
                        </span>
                        <strong style={{ color: "var(--dark-forest)" }}>
                          {ticket.driver_name}
                        </strong>
                      </div>

                      <div>
                        <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                          Vehicle Plate
                        </span>
                        <strong style={{ color: "var(--text-main)" }}>
                          {ticket.plate_number}
                        </strong>
                      </div>

                      <div>
                        <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                          Estimated Waste Load
                        </span>
                        <strong style={{ color: "var(--primary-green)" }}>
                          {ticket.estimated_load || "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                          Actual Collection Time
                        </span>
                        <strong style={{ color: "var(--text-main)" }}>
                          {ticket.actual_collection_time
                            ? new Date(ticket.actual_collection_time).toLocaleString()
                            : "Not yet recorded"}
                        </strong>
                      </div>

                      <div>
                        <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                          Ticket Created At
                        </span>
                        <strong style={{ color: "var(--text-secondary)" }}>
                          {new Date(ticket.created_at).toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {/* Trip Ticket Actions (Edit load, set actual time, delete) */}
                    <TripTicketActions
                      ticketId={ticket.id}
                      currentEstimatedLoad={ticket.estimated_load}
                      currentActualCollectionTime={ticket.actual_collection_time}
                      currentDriverName={ticket.driver_name}
                      currentPlateNumber={ticket.plate_number}
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
