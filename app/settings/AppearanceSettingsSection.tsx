"use client";

import { useState } from "react";
import { useTheme, type Theme } from "@/components/theme-provider";
import {
  Sun,
  Moon,
  Laptop,
  Palette,
  Check,
  Languages,
  Accessibility,
} from "lucide-react";

export default function AppearanceSettingsSection() {
  const { theme, resolvedTheme, setTheme, mounted } = useTheme();
  const [language, setLanguage] = useState<"en" | "fil">("en");

  const options: {
    id: Theme;
    label: string;
    description: string;
    icon: typeof Sun;
  }[] = [
    {
      id: "light",
      label: "Light Mode",
      description: "Clean, high-visibility green and crisp white interface.",
      icon: Sun,
    },
    {
      id: "dark",
      label: "Dark Mode",
      description: "Reduced eye strain with deep forest slate tones.",
      icon: Moon,
    },
    {
      id: "system",
      label: "System Default",
      description: "Automatically matches your operating system appearance.",
      icon: Laptop,
    },
  ];

  return (
    <div className="settings-section-card">
      {/* 1. Theme Selection */}
      <div className="settings-section-header">
        <div className="settings-section-icon">
          <Palette size={18} aria-hidden="true" />
        </div>
        <div>
          <h3>Appearance &amp; Theme</h3>
          <p className="hint">
            Customize the display mode for EcoGuard. Your preference applies immediately and is saved on this device.
          </p>
        </div>
      </div>

      <div className="theme-options-grid">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = mounted ? theme === opt.id : opt.id === "system";

          return (
            <button
              key={opt.id}
              type="button"
              className={`theme-option-card ${isSelected ? "selected" : ""}`}
              onClick={() => setTheme(opt.id)}
              aria-pressed={isSelected}
            >
              <div className="theme-option-top">
                <span className="theme-option-icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="theme-radio-circle">
                  {isSelected && <span className="theme-radio-dot" />}
                </span>
              </div>
              <strong className="theme-option-label">{opt.label}</strong>
              <p className="theme-option-desc">{opt.description}</p>
              {isSelected && (
                <span className="theme-active-pill">
                  <Check size={11} aria-hidden="true" /> Active
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="hint" style={{ marginTop: "12px", fontSize: "11.5px" }}>
        Currently displaying: <strong>{mounted ? (resolvedTheme === "dark" ? "Dark Mode" : "Light Mode") : "System Mode"}</strong>
        {mounted && theme === "system" ? " (following your system settings)" : ""}
      </p>

      <div className="settings-divider" style={{ margin: "24px 0" }} />

      {/* 2. Language Preference */}
      <div className="settings-section-header">
        <div className="settings-section-icon">
          <Languages size={18} aria-hidden="true" />
        </div>
        <div>
          <h3>Language Preference</h3>
          <p className="hint">
            Choose your preferred display language for system notices, guidelines, and MENR communications.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "12px" }}>
        <button
          type="button"
          className={`theme-option-card ${language === "en" ? "selected" : ""}`}
          onClick={() => setLanguage("en")}
          aria-pressed={language === "en"}
        >
          <div className="theme-option-top">
            <strong className="theme-option-label" style={{ margin: 0 }}>English (Philippines)</strong>
            <span className="theme-radio-circle">
              {language === "en" && <span className="theme-radio-dot" />}
            </span>
          </div>
          <p className="theme-option-desc" style={{ marginTop: "6px" }}>
            Official municipal administrative and legal terminology.
          </p>
          {language === "en" && (
            <span className="theme-active-pill">
              <Check size={11} aria-hidden="true" /> Active
            </span>
          )}
        </button>

        <button
          type="button"
          className={`theme-option-card ${language === "fil" ? "selected" : ""}`}
          onClick={() => setLanguage("fil")}
          aria-pressed={language === "fil"}
        >
          <div className="theme-option-top">
            <strong className="theme-option-label" style={{ margin: 0 }}>Filipino (Tagalog)</strong>
            <span className="theme-radio-circle">
              {language === "fil" && <span className="theme-radio-dot" />}
            </span>
          </div>
          <p className="theme-option-desc" style={{ marginTop: "6px" }}>
            Suportado sa AI Assistant at mga pampublikong abiso ng MENR.
          </p>
          {language === "fil" && (
            <span className="theme-active-pill">
              <Check size={11} aria-hidden="true" /> Active
            </span>
          )}
        </button>
      </div>

      <div className="settings-divider" style={{ margin: "24px 0" }} />

      {/* 3. Readability & Accessibility */}
      <div className="settings-section-header">
        <div className="settings-section-icon">
          <Accessibility size={18} aria-hidden="true" />
        </div>
        <div>
          <h3>Accessibility &amp; Readability</h3>
          <p className="hint">
            EcoGuard is designed to comply with WCAG 2.1 Level AA accessibility standards.
          </p>
        </div>
      </div>

      <div
        style={{
          background: "var(--surface-elevated, #F8FAFC)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "14px 16px",
          marginTop: "12px",
          fontSize: "12.5px",
          lineHeight: 1.6,
          color: "var(--text-secondary)",
        }}
      >
        <ul style={{ margin: 0, paddingLeft: "18px" }}>
          <li>
            <strong>Fluid Typography:</strong> Font sizes scale dynamically for optimal readability across mobile, tablet, and desktop viewports.
          </li>
          <li>
            <strong>High-Contrast Focus Indicators:</strong> All interactive buttons and forms support prominent keyboard navigation focus rings.
          </li>
          <li>
            <strong>Motion Preference:</strong> Interface animations automatically respect your system&apos;s <code>prefers-reduced-motion</code> setting.
          </li>
        </ul>
      </div>
    </div>
  );
}
