export const REPORT_TYPES = [
  "Environmental Complaints Report",
  "Tree Cutting Permit Applications Report",
  "Garbage Collection Schedule Report",
  "Trip Ticket Report",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];