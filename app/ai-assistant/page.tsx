"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, LoaderCircle, Send, Sparkles } from "lucide-react";
import {
  classifyEnvironmentalConcern,
  type GeminiResult,
} from "@/app/actions/gemini";
import ResidentFrame from "@/components/resident-frame";
import Link from "next/link";

export default function AIAssistantPage() {
  const router = useRouter();
  const [concern, setConcern] = useState("");
  const [result, setResult] = useState<GeminiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!concern.trim() || loading) {
      if (!concern.trim()) {
        setError("Please describe your environmental concern.");
      }
      return;
    }
    setLoading(true);
    try {
      const response = await classifyEnvironmentalConcern(concern.trim());
      if (!response.success) {
        setError(response.error ?? "Unable to process your concern.");
        return;
      }
      if (!response.result) {
        setError("EcoGuard AI returned no classification result.");
        return;
      }
      setResult(response.result);
    } catch {
      setError("An unexpected error occurred while communicating with EcoGuard AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ResidentFrame>
      <div className="form-page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">RESIDENT PORTAL • MABINI</p>
            <h1 className="page-title">EcoGuard AI Assistant</h1>
            <p className="page-subtitle">
              Get automated guidance on whether your concern requires a complaint report or a permit application.
            </p>
          </div>
          <div className="page-header-actions">
            <Link className="button secondary" href="/dashboard">
              <ArrowLeft size={16} aria-hidden="true" /> Back to Dashboard
            </Link>
          </div>
        </div>

        <section className="card form-card">
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "20px" }}>
          <div
            style={{
              background: "var(--light-green)",
              color: "var(--primary-green)",
              borderRadius: "12px",
              padding: "10px",
              display: "flex",
            }}
          >
            <Bot size={28} aria-hidden="true" />
          </div>
          <div>
            <h2 style={{ color: "var(--dark-forest)", margin: "0 0 6px" }}>
              How can we help today?
            </h2>
            <p className="hint">
              Describe a general environmental concern in your neighborhood. EcoGuard AI will point you to the correct form.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "16px 0 24px" }}>
          {[
            "I saw illegal dumping near the road.",
            "I need a permit before cutting a tree on my property.",
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="button secondary"
              style={{ fontSize: "12px", padding: "8px 12px", borderRadius: "16px" }}
              onClick={() => setConcern(prompt)}
            >
              <Sparkles size={13} aria-hidden="true" />
              {prompt}
            </button>
          ))}
        </div>

        {result && (
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Bot size={18} color="var(--primary-green)" aria-hidden="true" />
              <strong style={{ color: "var(--dark-forest)", fontSize: "14px" }}>
                EcoGuard AI Recommendation
              </strong>
            </div>
            <p style={{ margin: "0 0 16px", lineHeight: 1.6, color: "var(--text-main)", fontSize: "13.5px" }}>
              {result.message}
            </p>
            {result.module !== "unknown" && result.module !== "general_inquiry" && (
              <button
                className="button green"
                type="button"
                onClick={() =>
                  router.push(
                    result.module === "complaint"
                      ? "/complaints/new"
                      : result.module === "complaint_status"
                        ? "/complaints"
                        : result.module === "collection_schedule"
                          ? "/schedules"
                          : "/permits/new"
                  )
                }
              >
                {result.module === "complaint"
                  ? "Open Complaint Submission Form"
                  : result.module === "complaint_status"
                    ? "View My Complaints"
                    : result.module === "collection_schedule"
                      ? "View Collection Schedules"
                      : "Open Tree Cutting Permit Form"}
              </button>
            )}
          </div>
        )}

        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "16px",
              background: "#F8FAFC",
              borderRadius: "12px",
              marginBottom: "20px",
              color: "var(--text-secondary)",
              fontSize: "13px",
            }}
          >
            <LoaderCircle className="spin" size={18} aria-hidden="true" />
            Analyzing environmental concern...
          </div>
        )}

        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-end",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "12px",
            background: "var(--white)",
          }}
        >
          <label className="sr-only" htmlFor="concern-input">
            Describe your concern
          </label>
          <textarea
            id="concern-input"
            value={concern}
            onChange={(event) => setConcern(event.target.value)}
            placeholder="Type your environmental concern here..."
            rows={3}
            disabled={loading}
            style={{
              flex: 1,
              border: 0,
              outline: 0,
              resize: "none",
              fontSize: "13.5px",
              color: "var(--text-main)",
            }}
          />
          <button
            className="button green"
            type="submit"
            disabled={loading || !concern.trim()}
            style={{ minHeight: "42px", padding: "0 16px" }}
          >
            {loading ? (
              <LoaderCircle className="spin" size={16} aria-hidden="true" />
            ) : (
              <Send size={16} aria-hidden="true" />
            )}
          </button>
        </form>

        <p className="hint" style={{ marginTop: "12px", textAlign: "center" }}>
          For your privacy, please do not include names, phone numbers, or exact addresses in AI prompts.
        </p>
      </section>
      </div>
    </ResidentFrame>
  );
}
