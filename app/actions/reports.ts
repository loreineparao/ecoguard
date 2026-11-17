"use server";

import { createClient } from "@/lib/supabase/server";
import { REPORT_TYPES, type ReportType } from "@/lib/report-constants";

export type { ReportType };

export type ReportSummary = {
  totalCount: number;
  metric1: { label: string; value: number | string };
  metric2: { label: string; value: number | string };
  metric3: { label: string; value: number | string };
  metric4: { label: string; value: number | string };
};

export type ReportColumn = {
  key: string;
  label: string;
};

export type ReportResult = {
  success: boolean;
  error?: string;
  reportId?: string;
  reportType?: string;
  startDate?: string;
  endDate?: string;
  generatedAt?: string;
  generatedByName?: string;
  summary?: ReportSummary;
  columns?: ReportColumn[];
  rows?: Record<string, unknown>[];
};

/**
 * Generate a complete, aggregated report based on real database records and date ranges.
 */
export async function generateReportAction(params: {
  reportType: string;
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
    };
  }

  const { reportType, startDate, endDate } = params;

  // Normalize report type name for backward compatibility
  let normalizedType: ReportType = "Environmental Complaints Report";
  if (
    reportType === "Tree Cutting Permit Applications Report" ||
    reportType === "Tree Cutting Permit Report" ||
    reportType.toLowerCase().includes("permit")
  ) {
    normalizedType = "Tree Cutting Permit Applications Report";
  } else if (
    reportType === "Trip Ticket Report" ||
    reportType === "Garbage Collection Trip Ticket Report" ||
    reportType.toLowerCase().includes("trip ticket")
  ) {
    normalizedType = "Trip Ticket Report";
  } else if (
    reportType === "Garbage Collection Schedule Report" ||
    reportType === "Garbage Collection Report" ||
    reportType.toLowerCase().includes("collection")
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

      if (startDate) {
        query = query.gte("created_at", `${startDate}T00:00:00`);
      }
      if (endDate) {
        query = query.lte("created_at", `${endDate}T23:59:59.999`);
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
      const resolvedCount = list.filter((c) => c.status === "Resolved").length;
      const pendingCount = list.filter((c) => c.status === "Pending").length;
      const underReviewCount = list.filter((c) => c.status === "Under Review").length;
      const dispatchedCount = list.filter((c) => c.status === "Dispatched").length;

      summary = {
        totalCount,
        metric1: { label: "Resolved Complaints", value: resolvedCount },
        metric2: { label: "Pending Initial Review", value: pendingCount },
        metric3: { label: "Dispatched Actions", value: dispatchedCount },
        metric4: { label: "Under Evaluation", value: underReviewCount },
      };

      columns = [
        { key: "id", label: "Complaint ID" },
        { key: "category", label: "Category" },
        { key: "status", label: "Status" },
        { key: "address", label: "Incident Location / Barangay" },
        { key: "assigned_personnel", label: "Assigned Inspector" },
        { key: "created_at", label: "Date Submitted" },
        { key: "description", label: "Description" },
      ];

      rows = list.map((c) => ({
        id: c.id,
        category: c.category || "General",
        status: c.status || "Pending",
        address: locMap.get(c.id) || "Mabini Jurisdiction",
        assigned_personnel: c.assigned_personnel || "Unassigned",
        created_at: new Date(c.created_at).toLocaleDateString(),
        description: c.description || "N/A",
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

      if (startDate) {
        query = query.gte("submitted_at", `${startDate}T00:00:00`);
      }
      if (endDate) {
        query = query.lte("submitted_at", `${endDate}T23:59:59.999`);
      }

      const { data: applications, error: appErr } = await query;
      if (appErr) throw new Error(appErr.message);

      const list = applications || [];
      const totalCount = list.length;
      const approvedCount = list.filter(
        (a) => (a.application_status || "").toLowerCase() === "approved"
      ).length;
      const pendingCount = list.filter(
        (a) => (a.application_status || "").toLowerCase().includes("pending")
      ).length;
      const underReviewCount = list.filter(
        (a) => (a.application_status || "").toLowerCase() === "under review"
      ).length;
      const rejectedCount = list.filter(
        (a) => (a.application_status || "").toLowerCase() === "rejected"
      ).length;

      summary = {
        totalCount,
        metric1: { label: "Approved Permits", value: approvedCount },
        metric2: { label: "Pending Applications", value: pendingCount },
        metric3: { label: "Under Technical Review", value: underReviewCount },
        metric4: { label: "Disapproved / Rejected", value: rejectedCount },
      };

      columns = [
        { key: "id", label: "Application ID" },
        { key: "applicant_name", label: "Applicant Name" },
        { key: "application_status", label: "Permit Status" },
        { key: "submitted_at", label: "Date Submitted" },
        { key: "requirements_summary", label: "Requirements Filed" },
      ];

      rows = list.map((a) => {
        let reqSummary = "Complete Requirements";
        if (a.documentary_requirements && typeof a.documentary_requirements === "object") {
          const keys = Object.keys(a.documentary_requirements as Record<string, unknown>);
          reqSummary = `${keys.length} document types submitted`;
        }

        return {
          id: a.id,
          applicant_name: a.applicant_name,
          application_status: a.application_status || "Pending",
          submitted_at: a.submitted_at
            ? new Date(a.submitted_at).toLocaleDateString()
            : "N/A",
          requirements_summary: reqSummary,
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

      if (startDate) {
        query = query.gte("collection_time", `${startDate}T00:00:00`);
      }
      if (endDate) {
        query = query.lte("collection_time", `${endDate}T23:59:59.999`);
      }

      const { data: schedules, error: schedErr } = await query;
      if (schedErr) throw new Error(schedErr.message);

      const list = schedules || [];
      const totalCount = list.length;
      const uniqueBarangays = new Set(list.map((s) => s.barangay));
      const assignedVehicles = list.filter((s) => s.truck_id && s.truck_id.trim().length > 0).length;
      const assignedDrivers = list.filter((s) => s.driver_id && s.driver_id.trim().length > 0).length;
      const unassignedCount = totalCount - Math.min(assignedVehicles, assignedDrivers);

      summary = {
        totalCount,
        metric1: { label: "Barangays Covered", value: uniqueBarangays.size },
        metric2: { label: "Assigned Vehicles", value: assignedVehicles },
        metric3: { label: "Assigned Drivers", value: assignedDrivers },
        metric4: { label: "Pending Assignment", value: Math.max(0, unassignedCount) },
      };

      columns = [
        { key: "id", label: "Schedule ID" },
        { key: "barangay", label: "Barangay / Collection Area" },
        { key: "collection_time", label: "Scheduled Collection Time" },
        { key: "truck_id", label: "Assigned Truck / Vehicle" },
        { key: "driver_id", label: "Assigned Driver" },
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
    // 4. Trip Ticket Report
    // ==========================================
    else {
      let query = supabase
        .from("trip_tickets")
        .select("id, schedule_id, estimated_load, actual_collection_time, driver_name, plate_number, created_at")
        .order("created_at", { ascending: false });

      if (startDate) {
        query = query.gte("created_at", `${startDate}T00:00:00`);
      }
      if (endDate) {
        query = query.lte("created_at", `${endDate}T23:59:59.999`);
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
        metric1: { label: "Completed Waste Hauling Trips", value: completedCount },
        metric2: { label: "Pending Collections", value: pendingCount },
        metric3: { label: "Assigned Drivers", value: driverSet.size },
        metric4: { label: "Assigned Vehicles", value: vehicleSet.size },
      };

      columns = [
        { key: "id", label: "Trip Ticket ID" },
        { key: "plate_number", label: "Vehicle Plate" },
        { key: "driver_name", label: "Driver Name" },
        { key: "barangay", label: "Barangay Area" },
        { key: "estimated_load", label: "Estimated Waste Load" },
        { key: "status", label: "Trip Status" },
        { key: "actual_collection_time", label: "Actual Collection Time" },
        { key: "created_at", label: "Recorded Date" },
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
          status: isDone ? "Completed" : "Pending Collection",
          actual_collection_time: t.actual_collection_time
            ? new Date(t.actual_collection_time).toLocaleString()
            : "In Progress / Not Recorded",
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
      .single();

    if (saveErr) {
      console.warn("Could not save to reports archive table:", saveErr.message);
    }

    return {
      success: true,
      reportId: savedReport?.id || crypto.randomUUID(),
      reportType: normalizedType,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      generatedAt: new Date().toISOString(),
      generatedByName: profile.full_name || "MENR Administrator",
      summary,
      columns,
      rows,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error generating report.";
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Backward compatibility function for legacy createReport
 */
export async function createReport(reportType: string) {
  const result = await generateReportAction({ reportType });
  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }
  return {
    success: true,
    report: {
      id: result.reportId,
      report_type: result.reportType,
      generated_at: result.generatedAt,
      generated_by: result.generatedByName,
    },
  };
}
