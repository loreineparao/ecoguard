"use client";

import { Mail, ShieldCheck, Lock } from "lucide-react";

type AccountInformationSectionProps = {
  email: string;
  role: string;
  userId: string;
  isAdmin: boolean;
};

export default function AccountInformationSection({
  email,
  role,
  userId,
  isAdmin,
}: AccountInformationSectionProps) {
  return (
    <div className="settings-section-card">
      <div className="settings-section-header">
        <div className="settings-section-icon">
          <ShieldCheck size={18} aria-hidden="true" />
        </div>
        <div>
          <h3>Account Information</h3>
          <p className="hint">
            Your authenticated EcoGuard identity, registered email credential, and assigned municipal system role.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginTop: "16px" }}>
        {/* Read-Only Registered Email */}
        <div
          style={{
            background: "var(--surface-elevated, #F8FAFC)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "5px" }}>
              <Mail size={14} style={{ color: "var(--primary-green)" }} /> Registered Email
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <Lock size={11} /> Read-only
            </span>
          </div>
          <strong style={{ fontSize: "14px", color: "var(--dark-forest)", wordBreak: "break-all", display: "block" }}>
            {email}
          </strong>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>
            Primary identifier for authentication and municipal service notifications. Email updates are disabled through Settings to preserve records continuity.
          </span>
        </div>

        {/* Authenticated Account Role */}
        <div
          style={{
            background: "var(--surface-elevated, #F8FAFC)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "5px" }}>
              <ShieldCheck size={14} style={{ color: "var(--primary-green)" }} /> System Account Role
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <Lock size={11} /> Non-modifiable
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <strong style={{ fontSize: "14px", color: "var(--dark-forest)" }}>
              {role}
            </strong>
            <span className={`badge ${isAdmin ? "in-progress" : "resolved"}`} style={{ fontSize: "11px" }}>
              {isAdmin ? "MENR Staff" : "Resident"}
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>
            {isAdmin
              ? "Authorized for complaint dispatch, permit review, and collection reporting."
              : "Authorized for submitting environmental complaints, applying for permits, and viewing collection schedules."}
          </span>
        </div>
      </div>

      {/* Account ID / Identifier */}
      <div
        style={{
          marginTop: "12px",
          padding: "10px 14px",
          borderRadius: "8px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          fontSize: "12px",
        }}
      >
        <span style={{ color: "var(--text-secondary)" }}>Unique Account Identifier:</span>
        <code style={{ fontSize: "11.5px", color: "var(--primary-green)", fontFamily: "monospace" }}>
          {userId}
        </code>
      </div>
    </div>
  );
}
