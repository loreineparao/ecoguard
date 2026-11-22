"use client";

import { useTheme, type Theme } from "@/components/theme-provider";
import { Sun, Moon, Laptop, Palette } from "lucide-react";

export default function AppearanceSettingsSection() {
  const { theme, resolvedTheme, setTheme, mounted } = useTheme();

  const options: {
    id: Theme;
    label: string;
    description: string;
    icon: typeof Sun;
  }[] = [
    {
      id: "light",
      label: "Light Mode",
      description: "Clean green and white interface.",
      icon: Sun,
    },
    {
      id: "dark",
      label: "Dark Mode",
      description: "Reduced eye strain with deep forest tones.",
      icon: Moon,
    },
    {
      id: "system",
      label: "System Default",
      description: "Follows your operating system appearance.",
      icon: Laptop,
    },
  ];

  return (
    <div className="card settings-card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <div className="settings-section-icon" style={{ width: "32px", height: "32px", flexShrink: 0 }}>
          <Palette size={16} aria-hidden="true" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: "14.5px", color: "var(--dark-forest)" }}>Appearance &amp; Theme</h3>
          <p className="hint" style={{ fontSize: "11.5px", margin: "2px 0 0" }}>
            Customize your display mode.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
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
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon size={15} style={{ color: isSelected ? "var(--primary-green)" : "var(--text-secondary)" }} aria-hidden="true" />
                  <strong style={{ fontSize: "12.5px", color: "var(--text-main)" }}>{opt.label}</strong>
                </div>
                <span className="theme-radio-circle" style={{ width: "16px", height: "16px" }}>
                  {isSelected && <span className="theme-radio-dot" style={{ width: "8px", height: "8px" }} />}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>

      <p className="hint" style={{ marginTop: "10px", fontSize: "11px" }}>
        Active: <strong>{mounted ? (resolvedTheme === "dark" ? "Dark Mode" : "Light Mode") : "System Mode"}</strong>
        {mounted && theme === "system" ? " (system)" : ""}
      </p>
    </div>
  );
}
