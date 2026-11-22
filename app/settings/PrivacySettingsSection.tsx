"use client";

import Link from "next/link";
import {
  Shield,
  FileText,
  Lock,
  ExternalLink,
  Database,
  CheckCircle2,
  Archive,
} from "lucide-react";

export default function PrivacySettingsSection() {
  return (
    <div className="settings-section-card">
      <div className="settings-section-header">
        <div className="settings-section-icon">
          <Shield size={18} aria-hidden="true" />
        </div>
        <div>
          <h3>Privacy &amp; Data Governance</h3>
          <p className="hint">
            Information regarding how your personal information and submitted records are collected, handled, and protected.
          </p>
        </div>
      </div>

      {/* RA 10173 Notice */}
      <div
        style={{
          background: "var(--surface-elevated, #F8FAFC)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "16px",
          marginTop: "14px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <Lock size={18} style={{ color: "var(--primary-green)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ fontSize: "13.5px", color: "var(--dark-forest)", display: "block", marginBottom: "4px" }}>
              Republic Act No. 10173 (Data Privacy Act of 2012)
            </strong>
            <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
              The Municipal Environment and Natural Resources Office (MENR) of Mabini collects and processes resident
              information solely for administering municipal environmental services, investigating reported violations,
              and issuing environmental clearances. Personal data is treated with confidentiality and is never sold,
              rented, or shared with commercial marketing entities.
            </p>
          </div>
        </div>
      </div>

      {/* Types of Personal Information Processed */}
      <div style={{ marginTop: "18px" }}>
        <h4 style={{ fontSize: "13.5px", color: "var(--dark-forest)", margin: "0 0 10px" }}>
          Categories of Personal Information Processed
        </h4>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          <div
            style={{
              padding: "12px 14px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              background: "var(--surface)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <CheckCircle2 size={14} style={{ color: "var(--primary-green)" }} />
              <strong style={{ fontSize: "12.5px", color: "var(--text-main)" }}>Account Credentials</strong>
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.45 }}>
              Registered email address, encrypted authentication tokens, and municipal role identifier.
            </p>
          </div>

          <div
            style={{
              padding: "12px 14px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              background: "var(--surface)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <CheckCircle2 size={14} style={{ color: "var(--primary-green)" }} />
              <strong style={{ fontSize: "12.5px", color: "var(--text-main)" }}>Resident Profile Details</strong>
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.45 }}>
              Full name, contact phone number, residential address, and registered Mabini barangay.
            </p>
          </div>

          <div
            style={{
              padding: "12px 14px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              background: "var(--surface)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <CheckCircle2 size={14} style={{ color: "var(--primary-green)" }} />
              <strong style={{ fontSize: "12.5px", color: "var(--text-main)" }}>Environmental Filings</strong>
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.45 }}>
              Incident complaint photos, geolocation coordinates, and tree-cutting permit application documents.
            </p>
          </div>
        </div>
      </div>

      {/* Data Protection & RLS */}
      <div
        style={{
          marginTop: "16px",
          padding: "12px 14px",
          borderRadius: "8px",
          background: "var(--surface-elevated, #F8FAFC)",
          border: "1px solid var(--border)",
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
        }}
      >
        <Database size={16} style={{ color: "var(--primary-green)", flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--dark-forest)", display: "block", marginBottom: "2px" }}>
            Data Access &amp; Database Protection
          </strong>
          All records stored in Supabase PostgreSQL are safeguarded by Row Level Security (RLS) policies. Only
          authenticated residents can view their own profile records, while authorized MENR administrators inspect
          filings for official government evaluation.
        </div>
      </div>

      {/* Account Deletion & Records Retention Explanation */}
      <div
        style={{
          marginTop: "14px",
          padding: "12px 14px",
          borderRadius: "8px",
          background: "var(--surface-elevated, #F8FAFC)",
          border: "1px solid var(--border)",
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
        }}
      >
        <Archive size={16} style={{ color: "var(--primary-green)", flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--dark-forest)", display: "block", marginBottom: "2px" }}>
            Account Deletion vs. Municipal Records Retention
          </strong>
          When a resident deletes their account, personal identifiers, login credentials, and uploaded profile avatars
          are permanently purged. However, under public records management policies (such as Republic Act No. 9003 for
          solid waste complaints and Presidential Decree No. 705 for forestry applications), official municipal incident
          filings and permit logs are retained for municipal accountability and audit compliance, with user identifiers anonymized.
        </div>
      </div>

      {/* Link to Complete Privacy Policy */}
      <div
        style={{
          marginTop: "16px",
          paddingTop: "14px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          Need comprehensive details regarding municipal privacy practices?
        </span>
        <Link
          href="/support/privacy"
          style={{
            fontSize: "12.5px",
            color: "var(--primary-green)",
            textDecoration: "none",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <FileText size={14} aria-hidden="true" />
          Read Full Municipal Privacy Policy
          <ExternalLink size={12} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
