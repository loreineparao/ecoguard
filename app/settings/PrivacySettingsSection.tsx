"use client";

import Link from "next/link";
import {
  Shield,
  FileText,
  Lock,
  ExternalLink,
  Database,
  Eye,
  CheckCircle2,
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

      {/* RA 9003 & Data Privacy Notice */}
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
              Republic Act No. 10173 (Data Privacy Act of 2012) Compliance
            </strong>
            <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              The MENR Office of Mabini processes resident information exclusively for official environmental service administration, violation investigations, and permit approvals. Personal data is never monetized, sold, or shared with commercial entities.
            </p>
          </div>
        </div>
      </div>

      {/* Categories of Data Handled */}
      <div style={{ marginTop: "18px" }}>
        <h4 style={{ fontSize: "13.5px", color: "var(--dark-forest)", margin: "0 0 10px" }}>
          Categories of Data Handled in EcoGuard
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
              <strong style={{ fontSize: "12.5px", color: "var(--text-main)" }}>Account Profile</strong>
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              Full name, email address, contact phone number, and barangay residence in Mabini.
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
              <strong style={{ fontSize: "12.5px", color: "var(--text-main)" }}>Environmental Complaints</strong>
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              Incident photos, geolocation coordinates, violation descriptions, and inspector resolution notes.
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
              <strong style={{ fontSize: "12.5px", color: "var(--text-main)" }}>Forestry Permits</strong>
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              Tree cutting applications, land titles, barangay clearances, and MENR certification documents.
            </p>
          </div>
        </div>
      </div>

      {/* RLS Security Notice */}
      <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <Database size={15} style={{ color: "var(--primary-green)", flexShrink: 0 }} />
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          All database records are protected via PostgreSQL Row Level Security (RLS) policies. Only you and authorized MENR officers have access to your submitted documents.
        </span>
      </div>

      {/* Links to Privacy Policy */}
      <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
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
