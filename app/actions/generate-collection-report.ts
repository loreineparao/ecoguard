"use server";

import { generateReportAction } from "@/app/actions/reports";

export async function generateCollectionReport(startDate?: string, endDate?: string) {
  const result = await generateReportAction({
    reportType: "Garbage Collection Schedule Report",
    startDate,
    endDate,
  });

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
    summary: {
      totalSchedules: result.summary?.totalCount ?? 0,
      totalBarangays: result.summary?.metric1.value ?? 0,
      assignedTrucks: result.summary?.metric2.value ?? 0,
      assignedDrivers: result.summary?.metric3.value ?? 0,
      unassignedSchedules: result.summary?.metric4?.value ?? 0,
    },
    records: result.rows ?? [],
  };
}
