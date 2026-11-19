"use client";

import { useState } from "react";
import { generateReportAction } from "@/app/actions/reports";
import {
  REPORT_TYPES,
  type ReportType,
  type ReportResult,
} from "@/lib/report-constants";
import {
  Calendar,
  ChartNoAxesCombined,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Printer,
  RotateCcw,
} from "lucide-react";

export default function CreateReport() {
  const [reportType, setReportType] = useState<ReportType>(REPORT_TYPES[0]);
  const [selectDate, setSelectDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);

  // Clear stale report display whenever report type changes (Task 6)
  function handleReportTypeChange(newType: ReportType) {
    setReportType(newType);
    setReportResult(null);
    setError("");
  }

  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    // Clear previously displayed report while generating to avoid stale state mixing
    setReportResult(null);

    const result = await generateReportAction({
      reportType,
      selectDate: selectDate.trim() || undefined,
    });

    if (!result.success) {
      setError(result.error ?? "Unable to compile report records.");
      setLoading(false);
      return;
    }

    setReportResult(result);
    setLoading(false);
  }

  function handleReset() {
    setReportResult(null);
    setSelectDate("");
    setError("");
  }

  // Export to standard CSV file using active columns & rows
  function handleExportCSV() {
    if (!reportResult || !reportResult.columns || !reportResult.rows) return;

    const headers = reportResult.columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
    const csvRows = reportResult.rows.map((row) => {
      return (reportResult.columns || [])
        .map((col) => {
          const val = row[col.key];
          const str = val === null || val === undefined ? "" : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",");
    });

    const csvContent = "\uFEFF" + [headers, ...csvRows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateSlug = selectDate ? selectDate : "all_time";
    const filename = `${reportResult.reportType.replace(/\s+/g, "_")}_${dateSlug}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Native Print / PDF Export
  function handlePrint() {
    window.print();
  }

  return (
    <div style={{ marginBottom: "32px" }}>
      {/* Report Generation Configuration Form (Task 5) */}
      <section className="card no-print" style={{ marginBottom: "24px" }}>
        <div className="card-title">
          <div>
            <h2>Generate Official Environmental Report</h2>
            <p className="hint">
              Compile verified audit metrics, records, and summaries for MENR municipal administration.
            </p>
          </div>
          <ChartNoAxesCombined size={22} color="var(--primary-green)" aria-hidden="true" />
        </div>

        <form onSubmit={handleGenerate}>
          <div className="report-form-grid">
            {/* 1. Report Type Dropdown */}
            <div className="form-field">
              <label htmlFor="report-type">
                Select Official Report Type <span aria-hidden="true" style={{ color: "#DC2626" }}>*</span>
              </label>
              <select
                id="report-type"
                value={reportType}
                onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                disabled={loading}
              >
                {REPORT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Single Optional Date Picker (Task 5) */}
            <div className="form-field">
              <label htmlFor="report-date" className="flex items-center gap-1.5">
                <Calendar size={13} aria-hidden="true" className="text-slate-600 dark:text-white shrink-0" /> Select Date (Optional)
              </label>
              <input
                id="report-date"
                type="date"
                value={selectDate}
                onChange={(e) => setSelectDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="notice error" role="alert" style={{ marginTop: "14px" }}>
              {error}
            </div>
          )}

          {/* Form Actions Aligned Bottom-Right */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginTop: "20px",
              flexWrap: "wrap",
            }}
          >
            <span className="hint" style={{ fontSize: "12px" }}>
              Leave date blank to generate an all-time record audit.
            </span>

            <div className="report-action-btns" style={{ display: "flex", gap: "10px", marginLeft: "auto", flexWrap: "wrap" }}>
              {(reportResult || selectDate) && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  <RotateCcw size={14} aria-hidden="true" /> Reset View
                </button>
              )}
              <button
                type="submit"
                className="button green"
                disabled={loading}
              >
                {loading ? (
                  <LoaderCircle className="spin" size={16} aria-hidden="true" />
                ) : (
                  <FileText size={16} aria-hidden="true" />
                )}
                {loading ? "Compiling Report..." : "Generate Report"}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Generated Report Display (Task 6) */}
      {reportResult && (
        <section
          className="card report-view-container print-sheet"
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "28px",
            boxShadow: "0 4px 18px rgba(6, 59, 46, 0.05)",
          }}
        >
          {/* Official Report Header */}
          <div
            className="report-official-header"
            style={{
              borderBottom: "2px solid var(--primary-green)",
              paddingBottom: "18px",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span
                  style={{
                    background: "var(--light-green)",
                    color: "var(--primary-green)",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Official Municipal Audit Report
                </span>
                <span className="muted-id" style={{ fontSize: "11.5px" }}>
                  Ref #{reportResult.reportId?.slice(0, 8)}
                </span>
              </div>

              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "var(--dark-forest)",
                  margin: "4px 0",
                }}
              >
                {reportResult.reportType}
              </h2>

              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                Municipality of Mabini, Batangas · Municipal Environment and Natural Resources Office (MENR)
              </p>
            </div>

            {/* Export & Print Action Buttons */}
            <div className="no-print" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                type="button"
                className="button secondary"
                onClick={handleExportCSV}
                title="Download spreadsheet report"
                style={{ fontSize: "12.5px", padding: "7px 14px" }}
              >
                <FileSpreadsheet size={15} color="#166534" aria-hidden="true" />
                Export CSV
              </button>
              <button
                type="button"
                className="button outline"
                onClick={handlePrint}
                title="Print or Save as PDF"
                style={{ fontSize: "12.5px", padding: "7px 14px" }}
              >
                <Printer size={15} aria-hidden="true" />
                Print / Save PDF
              </button>
            </div>
          </div>

          {/* Report Metadata Row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px 24px",
              fontSize: "12.5px",
              color: "var(--text-secondary)",
              background: "var(--surface-elevated, #F8FAFC)",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid var(--border)",
            }}
          >
            <div>
              <strong>Date Scope:</strong>{" "}
              <span style={{ color: "var(--dark-forest)", fontWeight: 700 }}>
                {reportResult.dateLabel}
              </span>
            </div>
            <div>
              <strong>Generated On:</strong>{" "}
              <span>{new Date(reportResult.generatedAt).toLocaleString()}</span>
            </div>
            <div>
              <strong>Audited By:</strong>{" "}
              <span>{reportResult.generatedByName}</span>
            </div>
          </div>

          {/* Summary Metric Cards: Report-Specific (Task 6 Section D & E) */}
          {reportResult.summary && reportResult.summary.metrics && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(auto-fit, minmax(170px, 1fr))`,
                gap: "14px",
                marginBottom: "24px",
              }}
            >
              {reportResult.summary.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  style={{
                    background: idx === 0 ? "var(--light-green, #F1F8F4)" : "var(--surface-elevated, #F8FAFC)",
                    border: `1px solid ${idx === 0 ? "var(--primary-green)" : "var(--border)"}`,
                    borderRadius: "10px",
                    padding: "14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: idx === 0 ? "var(--primary-green)" : "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      display: "block",
                    }}
                  >
                    {metric.label}
                  </span>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "24px",
                      color: metric.color || (idx === 0 ? "var(--dark-forest)" : "var(--text-main)"),
                      marginTop: "4px",
                    }}
                  >
                    {metric.value}
                  </strong>
                </div>
              ))}
            </div>
          )}

          {/* Detailed Audit Records Table (Task 6 Section E & F) */}
          <div style={{ marginTop: "16px" }}>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--dark-forest)",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FileSpreadsheet size={16} aria-hidden="true" /> Detailed Audit Records ({reportResult.rows.length})
            </h3>

            {reportResult.rows.length === 0 ? (
              <div
                style={{
                  padding: "32px 20px",
                  textAlign: "center",
                  background: "var(--surface-elevated, #F8FAFC)",
                  borderRadius: "10px",
                  border: "1px dashed var(--border)",
                  color: "var(--text-secondary)",
                  fontSize: "13.5px",
                }}
              >
                No {reportResult.reportType} records found matching the scope ({reportResult.dateLabel}).
              </div>
            ) : (
              <div className="report-table-scroll-wrapper">
                <table className="report-data-table">
                  <thead>
                    <tr>
                      {reportResult.columns.map((col) => (
                        <th
                          key={col.key}
                          style={{
                            width: col.width || "auto",
                          }}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportResult.rows.map((row, idx) => (
                      <tr key={idx}>
                        {reportResult.columns.map((col) => {
                          const val = row[col.key];
                          const str = val === null || val === undefined ? "—" : String(val);

                          return (
                            <td key={col.key} style={{ verticalAlign: "top" }}>
                              {col.key === "status" || col.key === "application_status" ? (
                                <span
                                  className={`badge ${str.toLowerCase().replace(/\s+/g, "-")}`}
                                  style={{ fontSize: "11px", padding: "2px 7px" }}
                                >
                                  {str}
                                </span>
                              ) : col.key === "id" ? (
                                <span style={{ fontFamily: "monospace", fontSize: "11.5px", color: "var(--text-secondary)" }}>
                                  {str.length > 13 ? `${str.slice(0, 12)}…` : str}
                                </span>
                              ) : col.key === "description" ? (
                                <div
                                  style={{
                                    maxWidth: "340px",
                                    whiteSpace: "normal",
                                    lineHeight: "1.4",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {str}
                                </div>
                              ) : col.key === "requirements_info" ? (
                                <div
                                  style={{
                                    maxWidth: "280px",
                                    whiteSpace: "normal",
                                    lineHeight: "1.35",
                                    fontSize: "12px",
                                  }}
                                >
                                  {str}
                                </div>
                              ) : (
                                str
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Official Sign-off Footer */}
          <div
            className="report-official-signoff"
            style={{
              marginTop: "32px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "11.5px",
              color: "var(--text-secondary)",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <span>EcoGuard Environmental Complaint & Service Management System · Mabini, Batangas</span>
            </div>
            <div>
              <span>Verified MENR Administrative Document</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
