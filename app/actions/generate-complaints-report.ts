"use server";

import { generateReportAction } from "@/app/actions/reports";

export async function generateComplaintsReport(startDate?: string, endDate?: string) {
  const result = await generateReportAction({
    reportType: "Environmental Complaints Report",
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
      totalComplaints: result.summary?.totalCount ?? 0,
      pendingComplaints: result.summary?.metric1.value ?? 0,
      underReviewComplaints: result.summary?.metric2.value ?? 0,
      resolvedComplaints: result.summary?.metric3.value ?? 0,
      otherComplaints: result.summary?.metric4?.value ?? 0,
    },
    records: result.rows ?? [],
  };
}
