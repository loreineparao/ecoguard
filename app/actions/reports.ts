"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  ReportType,
  ReportMetric,
  ReportSummary,
  ReportColumn,
  ReportResult,
} from "@/lib/report-constants";

export type {
  ReportType,
  ReportMetric,
  ReportSummary,
  ReportColumn,
  ReportResult,
};

/**
 * Generate an official, isolated audit report based on real database records.
 * Supports single-day date filter or All-Time records.
 */
export async function generateReportAction(params: {
  reportType: string;
  selectDate?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ReportResult> {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be authenticated to generate reports.",
      reportType: "Environmental Complaints Report",
      isAllTime: true,
      dateLabel: "All-Time Records",
      generatedAt: new Date().toISOString(),
      generatedByName: "System",
      summary: { totalCount: 0, metrics: [], metric1: { label: "", value: 0 }, metric2: { label: "", value: 0 }, metric3: { label: "", value: 0 }, metric4: { label: "", value: 0 } },
      columns: [],
      rows: [],
    };
  }

  // 2. Verify admin role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    return {
      success: false,
      error: "Only authorized MENR administrators can generate official reports.",
      reportType: "Environmental Complaints Report",
      isAllTime: true,
      dateLabel: "All-Time Records",
      generatedAt: new Date().toISOString(),
      generatedByName: "System",
      summary: { totalCount: 0, metrics: [], metric1: { label: "", value: 0 }, metric2: { label: "", value: 0 }, metric3: { label: "", value: 0 }, metric4: { label: "", value: 0 } },
      columns: [],
      rows: [],
    };
  }

  const { reportType, selectDate, startDate, endDate } = params;

  // Determine date boundaries
  let effectiveStartDate: string | undefined;
  let effectiveEndDate: string | undefined;
  let isAllTime = true;
  let dateLabel = "All-Time Records";

  if (selectDate && selectDate.trim() !== "") {
    effectiveStartDate = `${selectDate}T00:00:00`;
    effectiveEndDate = `${selectDate}T23:59:59.999`;
    isAllTime = false;
    try {
      const parsed = new Date(`${selectDate}T00:00:00`);
      dateLabel = parsed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      dateLabel = selectDate;
    }
  } else if (startDate || endDate) {
    effectiveStartDate = startDate ? `${startDate}T00:00:00` : undefined;
    effectiveEndDate = endDate ? `${endDate}T23:59:59.999` : undefined;
    isAllTime = false;
    dateLabel = `${startDate || "Beginning"} to ${endDate || "Present"}`;
  }

  // Normalize report type strictly
  let normalizedType: ReportType = "Environmental Complaints Report";
  const lower = (reportType || "").toLowerCase().trim();

  if (
    lower.includes("tree cutting") ||
    lower.includes("permit")
  ) {
    normalizedType = "Tree Cutting Permit Applications Report";
  } else if (
    lower.includes("trip ticket") ||
    lower.includes("ticket")
  ) {
    normalizedType = "Garbage Collection Trip Ticket Report";
  } else if (
    lower.includes("schedule") ||
    lower.includes("garbage collection") ||
    lower.includes("collection")
  ) {
    normalizedType = "Garbage Collection Schedule Report";
  } else {
    normalizedType = "Environmental Complaints Report";
  }

  try {
    let summary: ReportSummary;
    let columns: ReportColumn[] = [];
    let rows: Record<string, unknown>[] = [];

    // ==========================================
    // 1. Environmental Complaints Report
    // ==========================================
    if (normalizedType === "Environmental Complaints Report") {
      let query = supabase
        .from("complaints")
        .select("id, user_id, category, description, status, assigned_personnel, created_at")
        .order("created_at", { ascending: false });

      if (effectiveStartDate) {
        query = query.gte("created_at", effectiveStartDate);
      }
      if (effectiveEndDate) {
        query = query.lte("created_at", effectiveEndDate);
      }

      const [{ data: complaints, error: compErr }, { data: locations }] =
        await Promise.all([
          query,
          supabase.from("locations").select("complaint_id, address"),
        ]);

      if (compErr) throw new Error(compErr.message);

      const locMap = new Map<string, string>();
      (locations || []).forEach((l) => {
        if (l.complaint_id && l.address) locMap.set(l.complaint_id, l.address);
      });

      const list = complaints || [];
      const totalCount = list.length;
      const pendingCount = list.filter((c) => (c.status || "").toLowerCase() === "pending").length;
      const underReviewCount = list.filter((c) => (c.status || "").toLowerCase() === "under review").length;
      const dispatchedCount = list.filter((c) => (c.status || "").toLowerCase() === "dispatched").length;
      const resolvedCount = list.filter((c) => (c.status || "").toLowerCase() === "resolved").length;

      summary = {
        totalCount,
        metrics: [
          { label: "Total Complaints", value: totalCount },
          { label: "Pending Complaints", value: pendingCount, color: "#D97706" },
          { label: "Under Review", value: underReviewCount, color: "#0284C7" },
          { label: "Dispatched", value: dispatchedCount, color: "#7C3AED" },
          { label: "Resolved", value: resolvedCount, color: "#166534" },
        ],
        metric1: { label: "Pending Complaints", value: pendingCount },
        metric2: { label: "Under Review", value: underReviewCount },
        metric3: { label: "Dispatched Actions", value: dispatchedCount },
        metric4: { label: "Resolved Complaints", value: resolvedCount },
      };

      columns = [
        { key: "id", label: "Complaint ID", width: "120px" },
        { key: "category", label: "Complaint Category", width: "160px" },
        { key: "status", label: "Status", width: "120px" },
        { key: "address", label: "Incident Location / Barangay", width: "180px" },
        { key: "assigned_personnel", label: "Assigned Inspector", width: "160px" },
        { key: "created_at", label: "Date Submitted", width: "130px" },
        { key: "description", label: "Description", width: "auto" },
      ];

      rows = list.map((c) => ({
        id: c.id,
        category: c.category || "General Environmental",
        status: c.status || "Pending",
        address: locMap.get(c.id) || "Mabini Area",
        assigned_personnel: c.assigned_personnel || "Unassigned",
        created_at: new Date(c.created_at).toLocaleDateString(),
        description: c.description || "No description provided.",
      }));
    }

    // ==========================================
    // 2. Tree Cutting Permit Applications Report
    // ==========================================
    else if (normalizedType === "Tree Cutting Permit Applications Report") {
      let query = supabase
        .from("permit_applications")
        .select("id, user_id, applicant_name, documentary_requirements, application_status, submitted_at")
        .order("submitted_at", { ascending: false });

      if (effectiveStartDate) {
        query = query.gte("submitted_at", effectiveStartDate);
      }
      if (effectiveEndDate) {
        query = query.lte("submitted_at", effectiveEndDate);
      }

      const { data: applications, error: appErr } = await query;
      if (appErr) throw new Error(appErr.message);

      const list = applications || [];
      const totalCount = list.length;
      const pendingCount = list.filter(
        (a) => (a.application_status || "").toLowerCase().includes("pending")
      ).length;
      const underReviewCount = list.filter(
        (a) => (a.application_status || "").toLowerCase() === "under review"
      ).length;
      const approvedCount = list.filter(
        (a) => (a.application_status || "").toLowerCase() === "approved"
      ).length;
      const rejectedCount = list.filter(
        (a) => (a.application_status || "").toLowerCase() === "rejected"
      ).length;

      summary = {
        totalCount,
        metrics: [
          { label: "Total Applications", value: totalCount },
          { label: "Pending Applications", value: pendingCount, color: "#D97706" },
          { label: "Under Technical Review", value: underReviewCount, color: "#0284C7" },
          { label: "Approved Permits", value: approvedCount, color: "#166534" },
          { label: "Disapproved / Rejected", value: rejectedCount, color: "#DC2626" },
        ],
        metric1: { label: "Approved Permits", value: approvedCount },
        metric2: { label: "Pending Review", value: pendingCount },
        metric3: { label: "Under Review", value: underReviewCount },
        metric4: { label: "Rejected Applications", value: rejectedCount },
      };

      columns = [
        { key: "id", label: "Application ID", width: "120px" },
        { key: "applicant_name", label: "Applicant Name", width: "200px" },
        { key: "application_status", label: "Application Status", width: "130px" },
        { key: "submitted_at", label: "Submission Date", width: "130px" },
        { key: "requirements_info", label: "Document Review Information", width: "auto" },
      ];

      rows = list.map((a) => {
        let reqSummary = "Complete Requirements";
        const reqObj = a.documentary_requirements as Record<string, unknown> | null;
        if (reqObj && typeof reqObj === "object") {
          const keys = Object.keys(reqObj);
          const hasResolution = Boolean(
            reqObj.no_objection === "submitted" ||
            reqObj.resolution_no_objection === "submitted" ||
            reqObj.resolution_interposing_no_objection === "submitted" ||
            reqObj.no_objection === true ||
            reqObj.resolution_no_objection === true
          );
          reqSummary = `${keys.length} documents filed · ${hasResolution ? "Resolution Verified" : "Resolution Pending"}`;
        }

        return {
          id: a.id,
          applicant_name: a.applicant_name,
          application_status: a.application_status || "Pending",
          submitted_at: a.submitted_at
            ? new Date(a.submitted_at).toLocaleDateString()
            : "N/A",
          requirements_info: reqSummary,
        };
      });
    }

    // ==========================================
    // 3. Garbage Collection Schedule Report
    // ==========================================
    else if (normalizedType === "Garbage Collection Schedule Report") {
      let query = supabase
        .from("collection_schedules")
        .select("id, barangay, collection_time, truck_id, driver_id")
        .order("collection_time", { ascending: true });

      if (effectiveStartDate) {
        query = query.gte("collection_time", effectiveStartDate);
      }
      if (effectiveEndDate) {
        query = query.lte("collection_time", effectiveEndDate);
      }

      const { data: schedules, error: schedErr } = await query;
      if (schedErr) throw new Error(schedErr.message);

      const list = schedules || [];
      const totalCount = list.length;
      const uniqueBarangays = new Set(
        list.map((s) => s.barangay?.trim()).filter((b): b is string => Boolean(b && b.length > 0))
      );
      const assignedVehicles = list.filter((s) => s.truck_id && s.truck_id.trim().length > 0).length;
      const assignedDrivers = list.filter((s) => s.driver_id && s.driver_id.trim().length > 0).length;

      summary = {
        totalCount,
        metrics: [
          { label: "Total Schedules", value: totalCount },
          { label: "Barangays Covered", value: uniqueBarangays.size, color: "#166534" },
          { label: "Assigned Trucks", value: assignedVehicles, color: "#0284C7" },
          { label: "Assigned Drivers", value: assignedDrivers, color: "#7C3AED" },
        ],
        metric1: { label: "Barangays Covered", value: uniqueBarangays.size },
        metric2: { label: "Assigned Trucks", value: assignedVehicles },
        metric3: { label: "Assigned Drivers", value: assignedDrivers },
        metric4: { label: "Total Schedules", value: totalCount },
      };

      columns = [
        { key: "id", label: "Schedule ID", width: "120px" },
        { key: "barangay", label: "Barangay / Route", width: "200px" },
        { key: "collection_time", label: "Collection Date & Time", width: "200px" },
        { key: "truck_id", label: "Assigned Truck", width: "150px" },
        { key: "driver_id", label: "Assigned Driver", width: "150px" },
      ];

      rows = list.map((s) => ({
        id: s.id,
        barangay: s.barangay,
        collection_time: s.collection_time
          ? new Date(s.collection_time).toLocaleString()
          : "Standard Schedule",
        truck_id: s.truck_id || "Unassigned",
        driver_id: s.driver_id || "Unassigned",
      }));
    }

    // ==========================================
    // 4. Garbage Collection Trip Ticket Report
    // ==========================================
    else {
      let query = supabase
        .from("trip_tickets")
        .select("id, schedule_id, estimated_load, actual_collection_time, driver_name, plate_number, created_at")
        .order("created_at", { ascending: false });

      // If date filtered, filter by actual_collection_time or created_at
      if (effectiveStartDate) {
        query = query.gte("created_at", effectiveStartDate);
      }
      if (effectiveEndDate) {
        query = query.lte("created_at", effectiveEndDate);
      }

      const [{ data: tickets, error: ticketErr }, { data: schedules }] =
        await Promise.all([
          query,
          supabase.from("collection_schedules").select("id, barangay, collection_time"),
        ]);

      if (ticketErr) throw new Error(ticketErr.message);

      const schedMap = new Map<string, { barangay: string; time: string }>();
      (schedules || []).forEach((s) => {
        schedMap.set(s.id, { barangay: s.barangay, time: s.collection_time });
      });

      const list = tickets || [];
      const totalCount = list.length;
      const completedCount = list.filter((t) => Boolean(t.actual_collection_time)).length;
      const pendingCount = totalCount - completedCount;

      const driverSet = new Set(
        list
          .map((t) => t.driver_name?.trim())
          .filter((name): name is string => Boolean(name && name.length > 0))
      );

      const vehicleSet = new Set(
        list
          .map((t) => t.plate_number?.trim())
          .filter((plate): plate is string => Boolean(plate && plate.length > 0))
      );

      summary = {
        totalCount,
        metrics: [
          { label: "Total Trip Tickets", value: totalCount },
          { label: "Completed Collections", value: completedCount, color: "#166534" },
          { label: "Historical Pending", value: pendingCount, color: "#D97706" },
          { label: "Assigned Drivers", value: driverSet.size, color: "#7C3AED" },
          { label: "Assigned Vehicles", value: vehicleSet.size, color: "#0284C7" },
        ],
        metric1: { label: "Completed Collections", value: completedCount },
        metric2: { label: "Pending Collections", value: pendingCount },
        metric3: { label: "Assigned Drivers", value: driverSet.size },
        metric4: { label: "Assigned Vehicles", value: vehicleSet.size },
      };

      columns = [
        { key: "id", label: "Trip Ticket ID", width: "120px" },
        { key: "driver_name", label: "Driver Name", width: "180px" },
        { key: "plate_number", label: "Vehicle Plate", width: "140px" },
        { key: "barangay", label: "Barangay / Route", width: "180px" },
        { key: "estimated_load", label: "Estimated Waste Load", width: "150px" },
        { key: "status", label: "Completion Status", width: "130px" },
        { key: "actual_collection_time", label: "Actual Collection Time", width: "180px" },
      ];

      rows = list.map((t) => {
        const sched = schedMap.get(t.schedule_id);
        const isDone = Boolean(t.actual_collection_time);

        return {
          id: t.id,
          plate_number: t.plate_number,
          driver_name: t.driver_name,
          barangay: sched?.barangay || "Mabini Route",
          estimated_load: t.estimated_load || "Standard Load",
          status: isDone ? "Completed" : "Pending",
          actual_collection_time: t.actual_collection_time
            ? new Date(t.actual_collection_time).toLocaleString()
            : "Awaiting Log",
          created_at: new Date(t.created_at).toLocaleDateString(),
        };
      });
    }

    // 4. Save report generation history in reports table
    const { data: savedReport, error: saveErr } = await supabase
      .from("reports")
      .insert({
        report_type: normalizedType,
        generated_by: user.id,
      })
      .select()
      .maybeSingle();

    if (saveErr) {
      console.warn("Could not save to reports archive table:", saveErr.message);
    }

    return {
      success: true,
      reportId: savedReport?.id || crypto.randomUUID(),
      reportType: normalizedType,
      selectDate: selectDate || undefined,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      isAllTime,
      dateLabel,
      generatedAt: new Date().toISOString(),
      generatedByName: profile.full_name || "MENR Administrator",
      summary,
      columns,
      rows,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error compiling report.";
    return {
      success: false,
      error: msg,
      reportType: normalizedType,
      isAllTime,
      dateLabel,
      generatedAt: new Date().toISOString(),
      generatedByName: profile.full_name || "MENR Administrator",
      summary: { totalCount: 0, metrics: [], metric1: { label: "", value: 0 }, metric2: { label: "", value: 0 }, metric3: { label: "", value: 0 }, metric4: { label: "", value: 0 } },
      columns: [],
      rows: [],
    };
  }
}
