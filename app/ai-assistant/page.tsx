"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { classifyEnvironmentalConcern } from "@/app/actions/gemini";
import ResidentFrame from "@/components/resident-frame";

export default function AIAssistantPage() {
  const router = useRouter();

  const [concern, setConcern] = useState("");
  const [result, setResult] = useState<{
    module: "complaint" | "permit" | "unknown";
    classification:
      | "illegal_dumping"
      | "tree_cutting"
      | "unknown";
    message: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    setResult(null);

    if (!concern.trim()) {
      setError("Please describe your environmental concern.");
      return;
    }

    setLoading(true);

    const response = await classifyEnvironmentalConcern(
      concern.trim()
    );

    setLoading(false);

    if (!response.success) {
  setError(response.error ?? "Unable to process your concern.");
  return;
}

if (!response.result) {
  setError("Gemini returned no classification result.");
  return;
}

setResult(response.result);
  }

  function handleModuleRedirect() {
    if (!result) {
      return;
    }

    if (result.module === "complaint") {
      router.push("/complaints/new");
      return;
    }

    if (result.module === "permit") {
      router.push("/permits/new");
      return;
    }
  }

  return (
    <ResidentFrame>
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#f5f7fa",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          EcoGuard AI Assistant
        </h1>

        <p
          style={{
            color: "#555",
            marginBottom: "25px",
            lineHeight: "1.6",
          }}
        >
          Describe your general environmental concern.
          The AI will help identify the appropriate EcoGuard
          module.
        </p>

        <textarea
          value={concern}
          onChange={(e) => setConcern(e.target.value)}
          placeholder="Example: I saw people throwing garbage beside the road."
          rows={6}
          style={{
            width: "100%",
            padding: "14px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            resize: "vertical",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        />

        <p
          style={{
            fontSize: "13px",
            color: "#777",
            marginTop: "10px",
          }}
        >
          Please do not enter your name, address, phone
          number, exact location, or other personal
          information in the AI Assistant.
        </p>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            marginTop: "15px",
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "8px",
            background: loading ? "#999" : "#2563eb",
            color: "white",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Analyzing..." : "Ask EcoGuard AI"}
        </button>

        {error && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "8px",
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "700",
                marginBottom: "10px",
              }}
            >
              AI Guidance
            </h2>

            <p
              style={{
                lineHeight: "1.6",
                marginBottom: "15px",
              }}
            >
              {result.message}
            </p>

            {result.module === "complaint" && (
              <button
                onClick={handleModuleRedirect}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#16a34a",
                  color: "white",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Go to Illegal Dumping Complaint
              </button>
            )}

            {result.module === "permit" && (
              <button
                onClick={handleModuleRedirect}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#16a34a",
                  color: "white",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Go to Tree Cutting Permit
              </button>
            )}

            {result.module === "unknown" && (
              <div
                style={{
                  padding: "12px",
                  background: "#fff7ed",
                  borderRadius: "8px",
                  color: "#9a3412",
                }}
              >
                This concern is currently outside the
                supported EcoGuard modules.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
    </ResidentFrame>
  );
}