"use client";

import { useState } from "react";
import {
  generateReportAction,
  type ReportResult,
} from "@/app/actions/reports";
import { REPORT_TYPES } from "@/lib/report-constants";
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
  const [reportType, setReportType] = useState<string>(REPORT_TYPES[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);

  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be later than end date.");
      setLoading(false);
      return;
    }

    const result = await generateReportAction({
      reportType,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
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
    setStartDate("");
    setEndDate("");
    setError("");
  }

  // Export to standard CSV file
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
    const filename = `${reportResult.reportType?.replace(/\s+/g, "_") || "EcoGuard_Report"}_${
      new Date().toISOString().split("T")[0]
    }.csv`;

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
      {/* Report Generation Configuration Form */}
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              marginTop: "8px",
            }}
          >
            {/* Report Type */}
            <div className="form-field" style={{ gridColumn: "span 2" }}>
              <label htmlFor="report-type">
                Select Official Report Type <span aria-hidden="true" style={{ color: "#DC2626" }}>*</span>
              </label>
              <select
                id="report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                disabled={loading}
              >
                {REPORT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="form-field">
              <label htmlFor="report-start-date">
                <Calendar size={13} aria-hidden="true" /> Filter From Date (Optional)
              </label>
              <input
                id="report-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* End Date */}
            <div className="form-field">
              <label htmlFor="report-end-date">
                <Calendar size={13} aria-hidden="true" /> Filter To Date (Optional)
              </label>
              <input
                id="report-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="notice error" role="alert" style={{ marginTop: "14px" }}>
              {error}
            </div>
          )}

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
              Leave date fields blank to compile an all-time record summary.
            </span>

            <div style={{ display: "flex", gap: "10px" }}>
              {reportResult && (
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

      {/* Generated Report Display */}
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
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
              background: "#F8FAFC",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid var(--border)",
            }}
          >
            <div>
              <strong>Date Range Filter:</strong>{" "}
              <span style={{ color: "var(--dark-forest)", fontWeight: 600 }}>
                {reportResult.startDate || reportResult.endDate
                  ? `${reportResult.startDate || "Beginning"} to ${
                      reportResult.endDate || "Present"
                    }`
                  : "All Recorded Entries (All-Time)"}
              </span>
            </div>
            <div>
              <strong>Generated On:</strong>{" "}
              <span>{new Date(reportResult.generatedAt || "").toLocaleString()}</span>
            </div>
            <div>
              <strong>Audited By:</strong>{" "}
              <span>{reportResult.generatedByName}</span>
            </div>
          </div>

          {/* Summary Metric Cards */}
          {reportResult.summary && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "14px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  background: "#F1F8F4",
                  border: "1px solid #C8E6C9",
                  borderRadius: "10px",
                  padding: "14px",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary-green)", textTransform: "uppercase" }}>
                  Total Recorded Records
                </span>
                <strong style={{ display: "block", fontSize: "24px", color: "var(--dark-forest)", marginTop: "2px" }}>
                  {reportResult.summary.totalCount}
                </strong>
              </div>

              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "14px",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  {reportResult.summary.metric1.label}
                </span>
                <strong style={{ display: "block", fontSize: "24px", color: "#166534", marginTop: "2px" }}>
                  {reportResult.summary.metric1.value}
                </strong>
              </div>

              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "14px",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  {reportResult.summary.metric2.label}
                </span>
                <strong style={{ display: "block", fontSize: "24px", color: "#D97706", marginTop: "2px" }}>
                  {reportResult.summary.metric2.value}
                </strong>
              </div>

              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "14px",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  {reportResult.summary.metric3.label}
                </span>
                <strong style={{ display: "block", fontSize: "24px", color: "#0284C7", marginTop: "2px" }}>
                  {reportResult.summary.metric3.value}
                </strong>
              </div>

              {reportResult.summary.metric4 && (
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "14px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                    {reportResult.summary.metric4.label}
                  </span>
                  <strong style={{ display: "block", fontSize: "24px", color: "var(--text-main)", marginTop: "2px" }}>
                    {reportResult.summary.metric4.value}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* Organized Data Table */}
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
              <FileSpreadsheet size={16} aria-hidden="true" /> Detailed Audit Records ({reportResult.rows?.length || 0})
            </h3>

            {(!reportResult.rows || reportResult.rows.length === 0) ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  background: "#F8FAFC",
                  borderRadius: "8px",
                  border: "1px dashed var(--border)",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                }}
              >
                No records found matching the specified parameters.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12.5px",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#F1F5F9", borderBottom: "2px solid var(--border)" }}>
                      {reportResult.columns?.map((col) => (
                        <th
                          key={col.key}
                          style={{
                            padding: "10px 12px",
                            fontWeight: 700,
                            color: "var(--dark-forest)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportResult.rows.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          background: idx % 2 === 0 ? "var(--white)" : "#F8FAFC",
                        }}
                      >
                        {reportResult.columns?.map((col) => {
                          const val = row[col.key];
                          const str = val === null || val === undefined ? "—" : String(val);

                          return (
                            <td
                              key={col.key}
                              style={{
                                padding: "9px 12px",
                                color: "var(--text-main)",
                                verticalAlign: "top",
                              }}
                            >
                              {col.key === "status" || col.key === "application_status" ? (
                                <span
                                  className={`badge ${str.toLowerCase().replace(/\s+/g, "-")}`}
                                  style={{ fontSize: "11px", padding: "2px 7px" }}
                                >
                                  {str}
                                </span>
                              ) : col.key === "id" ? (
                                <span style={{ fontFamily: "monospace", fontSize: "11.5px", color: "var(--text-secondary)" }}>
                                  {str.slice(0, 13)}...
                                </span>
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
              <span>EcoGuard Environmental Management System · Mabini, Batangas</span>
            </div>
            <div>
              <span>Verified System Audit Document</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
