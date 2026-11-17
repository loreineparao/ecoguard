"use server";

import { generateReportAction } from "@/app/actions/reports";

export async function generatePermitsReport(startDate?: string, endDate?: string) {
  const result = await generateReportAction({
    reportType: "Tree Cutting Permit Applications Report",
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
      totalApplications: result.summary?.totalCount ?? 0,
      pendingApplications: result.summary?.metric1.value ?? 0,
      underReviewApplications: result.summary?.metric2.value ?? 0,
      approvedApplications: result.summary?.metric3.value ?? 0,
      rejectedApplications: result.summary?.metric4?.value ?? 0,
    },
    records: result.rows ?? [],
  };
}
