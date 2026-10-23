"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitPermitApplication } from "@/app/actions/permits";
import { uploadPermitDocument } from "@/app/actions/permit-documents";

export default function NewPermitPage() {
  const router = useRouter();

  const [applicantName, setApplicantName] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!applicantName.trim()) {
      setError("Please enter your applicant name.");
      return;
    }

    setLoading(true);

    // 1. Create the permit application
    const result = await submitPermitApplication(
      applicantName.trim(),
      {
        tree_cutting_permit: "submitted",
      }
    );

    if (!result.success) {
      setLoading(false);
      setError(
        result.error ?? "Unable to submit the permit application."
      );
      return;
    }

    // 2. Get the new application ID
    const applicationId = result.application?.id;

    if (!applicationId) {
      setLoading(false);
      setError(
        "Application was created, but no application ID was returned."
      );
      return;
    }

    // 3. Upload the supporting document if selected
    if (documentFile) {
      const documentResult = await uploadPermitDocument(
        applicationId,
        documentFile
      );

      if (!documentResult.success) {
        setLoading(false);
        setError(
          `Permit application was created, but the document could not be uploaded. ${
            documentResult.error ?? ""
          }`
        );
        return;
      }
    }

    // 4. Success
    setLoading(false);

    setMessage(
      documentFile
        ? "Tree cutting permit application and document submitted successfully."
        : "Tree cutting permit application submitted successfully."
    );

    setApplicantName("");
    setDocumentFile(null);

    setTimeout(() => {
      router.push("/permits/new");
    }, 2000);
  }

  return (
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
          Tree Cutting Permit Application
        </h1>

        <p
          style={{
            color: "#555",
            lineHeight: "1.6",
            marginBottom: "25px",
          }}
        >
          Submit your application for a tree cutting permit.
          Required supporting documents may be uploaded below.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Applicant Name */}

          <label
            htmlFor="applicantName"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Applicant Name
          </label>

          <input
            id="applicantName"
            type="text"
            value={applicantName}
            onChange={(event) =>
              setApplicantName(event.target.value)
            }
            placeholder="Enter your full name"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              boxSizing: "border-box",
            }}
          />

          {/* Document */}

          <label
            htmlFor="document"
            style={{
              display: "block",
              fontWeight: "600",
              marginTop: "20px",
              marginBottom: "8px",
            }}
          >
            Supporting Document
          </label>

          <input
            id="document"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            disabled={loading}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setDocumentFile(file);
            }}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              boxSizing: "border-box",
              background: "#fff",
            }}
          />

          <p
            style={{
              fontSize: "13px",
              color: "#777",
              marginTop: "8px",
              lineHeight: "1.5",
            }}
          >
            Accepted formats: PDF, JPG, PNG, and WEBP. Maximum
            file size: 5 MB.
          </p>

          {/* Message */}

          {error && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: "8px",
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                background: "#dcfce7",
                color: "#166534",
                borderRadius: "8px",
              }}
            >
              {message}
            </div>
          )}

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "14px",
              border: "none",
              borderRadius: "8px",
              background: loading ? "#999" : "#16a34a",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Submitting..."
              : "Submit Tree Cutting Permit"}
          </button>

          {/* Cancel */}

          <button
            type="button"
            onClick={() => router.push("/ai-assistant")}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              background: "white",
              color: "#333",
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Back to AI Assistant
          </button>
        </form>
      </div>
    </main>
  );
}