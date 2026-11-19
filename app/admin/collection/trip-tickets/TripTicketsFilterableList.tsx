"use client";

import { useMemo, useState } from "react";
import TripTicketActions from "./TripTicketActions";
import ActionMenu from "@/components/action-menu";
import ConfirmModal from "@/components/confirm-modal";
import { deleteTripTicket } from "@/app/actions/delete-trip-ticket";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
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
  const [ticketsList, setTicketsList] = useState(tickets);
  const [prevTickets, setPrevTickets] = useState(tickets);
  if (tickets !== prevTickets) {
    setPrevTickets(tickets);
    setTicketsList(tickets);
  }

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [driverFilter, setDriverFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Action Menu and Edit / Delete states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TripTicket | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    return ticketsList.filter((ticket) => {
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

      // 2. Status Filter (Completed Collections)
      if (statusFilter === "COMPLETED" && !isCompleted) return false;

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

      // 6. Single Calendar Day Date Filter (Task 4)
      if (dateFilter) {
        const effectiveDateStr = ticket.actual_collection_time || ticket.created_at;
        if (!effectiveDateStr) return false;

        const ticketDate = new Date(effectiveDateStr);

        // Local calendar comparison
        const y = ticketDate.getFullYear();
        const m = String(ticketDate.getMonth() + 1).padStart(2, "0");
        const d = String(ticketDate.getDate()).padStart(2, "0");
        const localYMD = `${y}-${m}-${d}`;

        // UTC calendar comparison (safeguard against UTC-stored timestamps)
        const utcY = ticketDate.getUTCFullYear();
        const utcM = String(ticketDate.getUTCMonth() + 1).padStart(2, "0");
        const utcD = String(ticketDate.getUTCDate()).padStart(2, "0");
        const utcYMD = `${utcY}-${utcM}-${utcD}`;

        // Local day boundaries
        const startOfDay = new Date(`${dateFilter}T00:00:00`);
        const endOfDay = new Date(`${dateFilter}T23:59:59.999`);
        const inLocalRange = ticketDate >= startOfDay && ticketDate <= endOfDay;

        if (localYMD !== dateFilter && utcYMD !== dateFilter && !inLocalRange) {
          return false;
        }
      }

      return true;
    });
  }, [
    ticketsList,
    scheduleMap,
    searchTerm,
    statusFilter,
    driverFilter,
    vehicleFilter,
    barangayFilter,
    dateFilter,
  ]);

  const secondaryFilterCount =
    (driverFilter.trim() !== "" ? 1 : 0) +
    (vehicleFilter.trim() !== "" ? 1 : 0) +
    (barangayFilter !== "ALL" ? 1 : 0) +
    (dateFilter !== "" ? 1 : 0);

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
    setDateFilter("");
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

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const result = await deleteTripTicket(deleteTarget.id);
    setIsDeleting(false);

    if (!result.success) {
      alert(result.error ?? "Unable to delete trip ticket.");
      return;
    }

    setTicketsList((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
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

          {/* 2. Primary Status Dropdown (Pending Collection removed per Task 1B) */}
          <select
            id="ticket-status-filter"
            className="admin-toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by trip status"
          >
            <option value="ALL">All Completed Trips</option>
            <option value="COMPLETED">Completed Collection</option>
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
            Showing {filteredTickets.length} of {ticketsList.length}
          </span>
        </div>

        {/* Collapsible Secondary Filters Panel (Task 1: Consistent 4-column grid) */}
        {showAdvancedFilters && (
          <div className="admin-filter-drawer">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {/* 1. Driver Name */}
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="driver-filter"
                  className="flex min-h-5 items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  <User size={13} aria-hidden="true" className="shrink-0" />
                  <span>Driver Name</span>
                </label>
                <div className="admin-toolbar-input-wrapper">
                  <input
                    id="driver-filter"
                    type="text"
                    className="admin-toolbar-input"
                    placeholder="Filter driver name..."
                    value={driverFilter}
                    onChange={(e) => setDriverFilter(e.target.value)}
                  />
                  {driverFilter && (
                    <button
                      type="button"
                      className="admin-toolbar-clear-input"
                      onClick={() => setDriverFilter("")}
                      aria-label="Clear driver filter"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Vehicle Plate */}
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="vehicle-filter"
                  className="flex min-h-5 items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  <Truck size={13} aria-hidden="true" className="shrink-0" />
                  <span>Vehicle Plate</span>
                </label>
                <div className="admin-toolbar-input-wrapper">
                  <input
                    id="vehicle-filter"
                    type="text"
                    className="admin-toolbar-input"
                    placeholder="Filter plate number..."
                    value={vehicleFilter}
                    onChange={(e) => setVehicleFilter(e.target.value)}
                  />
                  {vehicleFilter && (
                    <button
                      type="button"
                      className="admin-toolbar-clear-input"
                      onClick={() => setVehicleFilter("")}
                      aria-label="Clear vehicle filter"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Barangay / Route */}
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="barangay-filter"
                  className="flex min-h-5 items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  <MapPin size={13} aria-hidden="true" className="shrink-0" />
                  <span>Barangay / Route</span>
                </label>
                <div className="admin-toolbar-input-wrapper">
                  <select
                    id="barangay-filter"
                    className="admin-toolbar-input select"
                    value={barangayFilter}
                    onChange={(e) => setBarangayFilter(e.target.value)}
                  >
                    <option value="ALL">All Barangays</option>
                    {distinctBarangays.map((bgy) => (
                      <option key={bgy} value={bgy}>
                        {bgy}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Date (Single Date Picker) */}
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="ticket-date-filter"
                  className="flex min-h-5 items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  <Calendar size={13} aria-hidden="true" className="shrink-0 text-slate-600 dark:text-white" />
                  <span>Date</span>
                </label>
                <div className="admin-toolbar-input-wrapper">
                  <input
                    id="ticket-date-filter"
                    type="date"
                    className="admin-toolbar-input date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                  {dateFilter && (
                    <button
                      type="button"
                      className="admin-toolbar-clear-input"
                      onClick={() => setDateFilter("")}
                      aria-label="Clear date filter"
                      style={{ right: "32px" }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="admin-toolbar-chips">
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", alignSelf: "center" }}>
              Active filters:
            </span>

            {searchTerm.trim() && (
              <span className="admin-filter-chip">
                Search: <strong>{searchTerm}</strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => setSearchTerm("")}
                  title="Remove search query"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {statusFilter !== "ALL" && (
              <span className="admin-filter-chip">
                Status: <strong>Completed</strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => setStatusFilter("ALL")}
                  title="Reset status"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {driverFilter.trim() && (
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

            {vehicleFilter.trim() && (
              <span className="admin-filter-chip">
                Plate: <strong>{vehicleFilter}</strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => setVehicleFilter("")}
                  title="Remove vehicle filter"
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

            {dateFilter !== "" && (
              <span className="admin-filter-chip">
                Date: <strong>{dateFilter}</strong>
                <button
                  type="button"
                  className="admin-filter-chip-remove"
                  onClick={() => setDateFilter("")}
                  title="Remove date filter"
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
            const isEditing = editingId === ticket.id;

            return (
              <article
                key={ticket.id}
                className={`admin-record-card ${isExpanded || isEditing ? "expanded" : ""}`}
              >
                {/* Header Row: Title, ID, Status Badge & Upper-Right ActionMenu */}
                <div
                  className="admin-record-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span
                      className="activity-icon"
                      style={{
                        background: "#E0F2FE",
                        color: "#0284C7",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      <Truck size={18} aria-hidden="true" />
                    </span>
                    <div style={{ minWidth: 0, flex: 1, wordBreak: "break-word" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <h2
                          style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            margin: 0,
                            color: "var(--dark-forest)",
                            wordBreak: "break-word",
                          }}
                        >
                          Trip Ticket: {ticket.plate_number}
                        </h2>
                        {/* Status Badge */}
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
                      <span
                        className="muted-id"
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          display: "block",
                          wordBreak: "break-all",
                          marginTop: "2px",
                        }}
                      >
                        ID: {ticket.id}
                      </span>
                    </div>
                  </div>

                  {/* Upper-Right Three-Dot Action Menu (Pinned to top-right corner on all devices) */}
                  <div style={{ flexShrink: 0, marginLeft: "auto" }}>
                    <ActionMenu
                      items={[
                        {
                          label: isEditing ? "Close Edit" : "Edit Trip Ticket",
                          icon: <Edit size={14} />,
                          onClick: () => {
                            setEditingId(isEditing ? null : ticket.id);
                            if (!expandedIds.has(ticket.id)) {
                              toggleExpand(ticket.id);
                            }
                          },
                        },
                        {
                          label: "Delete Trip Ticket",
                          icon: <Trash2 size={14} />,
                          variant: "danger",
                          onClick: () => setDeleteTarget(ticket),
                        },
                      ]}
                    />
                  </div>
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
                    {isExpanded ? "Viewing trip details & ticket management" : "Click to view logs & record details"}
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
                        background: "var(--surface-elevated, #F8FAFC)",
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

                    {/* Edit Form (Revealed ONLY when Edit is selected from ActionMenu) */}
                    {isEditing && (
                      <TripTicketActions
                        ticketId={ticket.id}
                        currentEstimatedLoad={ticket.estimated_load}
                        currentActualCollectionTime={ticket.actual_collection_time}
                        currentDriverName={ticket.driver_name}
                        currentPlateNumber={ticket.plate_number}
                        onCancel={() => setEditingId(null)}
                        onSaved={(updated) => {
                          setTicketsList((prev) =>
                            prev.map((t) => (t.id === ticket.id ? { ...t, ...updated } : t))
                          );
                          setEditingId(null);
                        }}
                      />
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal (Task 4) */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Trip Ticket"
        description={`Are you sure you want to delete trip ticket #${deleteTarget?.plate_number} (${deleteTarget?.id.slice(0, 8)}...)? This record will be permanently deleted.`}
        confirmText="Delete Ticket"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
