export const REPORT_TYPES = [
  "Environmental Complaints Report",
  "Tree Cutting Permit Applications Report",
  "Garbage Collection Schedule Report",
  "Garbage Collection Trip Ticket Report",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number] | "Trip Ticket Report";

export type ReportMetric = {
  label: string;
  value: number | string;
  color?: string;
};

export type ReportSummary = {
  totalCount: number;
  metrics: ReportMetric[];
  // Backwards compatibility for callers expecting metric1..metric4
  metric1: { label: string; value: number | string };
  metric2: { label: string; value: number | string };
  metric3: { label: string; value: number | string };
  metric4: { label: string; value: number | string };
};

export type ReportColumn = {
  key: string;
  label: string;
  width?: string;
};

export type ReportResult = {
  success: boolean;
  error?: string;
  reportId?: string;
  reportType: ReportType;
  selectDate?: string;
  startDate?: string;
  endDate?: string;
  isAllTime: boolean;
  dateLabel: string;
  generatedAt: string;
  generatedByName: string;
  summary: ReportSummary;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
};
