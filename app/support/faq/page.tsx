"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  CircleHelp,
  Search,
} from "lucide-react";
import { MENR_OFFICE_INFO } from "@/lib/mabini-constants";

type FAQItem = {
  id: string;
  category: "General" | "Complaints" | "Permits" | "Schedules" | "Account & Security";
  question: string;
  answer: string | React.ReactNode;
};

const FAQ_LIST: FAQItem[] = [
  {
    id: "what-is-ecoguard",
    category: "General",
    question: "What is EcoGuard?",
    answer:
      "EcoGuard is an AI-enabled web-based environmental complaint and municipal service management system developed specifically for the Municipal Environment and Natural Resources (MENR) Office of Mabini, Batangas. It provides residents with a unified digital portal to submit environmental concern reports, apply for tree-cutting permits, check garbage collection timetables, and receive automated guidance via an integrated AI Assistant.",
  },
  {
    id: "who-can-register",
    category: "General",
    question: "Who can register for an EcoGuard resident account?",
    answer:
      "Any resident, property owner, or community stakeholder residing within or possessing property in the 34 barangays of the Municipality of Mabini, Batangas can register for free. Registration requires a valid email address and the resident's full name, followed by activating the account through an email confirmation link.",
  },
  {
    id: "how-to-submit-complaint",
    category: "Complaints",
    question: "How can residents submit an environmental complaint?",
    answer: (
      <div>
        <p style={{ margin: "0 0 8px" }}>
          To submit an environmental concern report:
        </p>
        <ol style={{ paddingLeft: "20px", margin: "0 0 8px", lineHeight: 1.6 }}>
          <li>Sign in to your resident account and click <strong>Submit Complaint</strong> or navigate to <code>/complaints/new</code>.</li>
          <li>Select the concern category (e.g. <em>Illegal Dumping</em>).</li>
          <li>Describe the issue in detail, noting any active hazards or dumping frequency.</li>
          <li>Capture your current GPS location with the <strong>Capture Location</strong> button, or type the nearest landmark or street address.</li>
          <li>Attach <strong>mandatory photographic evidence</strong> (JPG, PNG, or WEBP up to 5 MB) clearly depicting the environmental infraction.</li>
          <li>Click <strong>Submit Complaint</strong> to register your report with the MENR Office.</li>
        </ol>
      </div>
    ),
  },
  {
    id: "supported-complaints",
    category: "Complaints",
    question: "What environmental complaints are currently supported?",
    answer:
      "EcoGuard currently prioritizes and enforces reports for Illegal Dumping and Solid Waste Violations (prohibited under RA 9003). When submitting a complaint, residents must provide photographic evidence and exact location coordinates or landmarks so MENR field inspectors can investigate the scene.",
  },
  {
    id: "track-complaint-status",
    category: "Complaints",
    question: "How can residents track their complaint status?",
    answer: (
      <div>
        <p style={{ margin: "0 0 8px" }}>
          You can track the progress of all your submitted reports in real time:
        </p>
        <ul style={{ paddingLeft: "20px", margin: 0, lineHeight: 1.6 }}>
          <li><strong>Pending</strong>: Your complaint has been recorded and is queued for MENR triage and assessment.</li>
          <li><strong>Dispatched / In Progress</strong>: MENR field officers or waste collection units have been assigned to inspect and address the concern.</li>
          <li><strong>Resolved</strong>: Action has been taken and the environmental issue has been cleared.</li>
        </ul>
        <p style={{ marginTop: "8px", marginBottom: 0 }}>
          View all reports anytime under <strong>My Complaints</strong> (<code>/complaints</code>).
        </p>
      </div>
    ),
  },
  {
    id: "how-to-apply-permit",
    category: "Permits",
    question: "How can residents apply for a tree-cutting permit?",
    answer: (
      <div>
        <p style={{ margin: "0 0 8px" }}>
          Residents requiring a tree cutting or trimming permit can apply digitally through the <strong>Tree Cutting Permit</strong> section (<code>/permits/new</code>).
        </p>
        <p style={{ margin: 0 }}>
          The applicant must enter their full name, specify the purpose for cutting (such as safety hazard, structural risk, or municipal clearance), and upload all 5 mandatory statutory documents.
        </p>
      </div>
    ),
  },
  {
    id: "required-permit-documents",
    category: "Permits",
    question: "What documents are required for a tree-cutting permit?",
    answer: (
      <div>
        <p style={{ margin: "0 0 8px" }}>
          To ensure strict compliance with DENR regulations and local forestry guidelines (PD 705), the system enforces <strong>5 mandatory requirements</strong>:
        </p>
        <ol style={{ paddingLeft: "20px", margin: 0, lineHeight: 1.6 }}>
          <li><strong>Land Title / Proof of Ownership</strong>: Proof that the trees are situated on your titled property or written consent from the registered owner.</li>
          <li><strong>Application Letter</strong>: Formal letter addressed to the Municipal Mayor and MENR Officer stating the intent and number of trees.</li>
          <li><strong>Barangay Clearance</strong>: Clearance issued by the Barangay Captain having jurisdiction over the property.</li>
          <li><strong>Resolution of No Objection</strong>: Official Barangay Resolution certifying no community objection to the tree cutting.</li>
          <li><strong>Tree Photos</strong>: At least one clear photograph showing the condition, species, and location of the trees to be cut.</li>
        </ol>
      </div>
    ),
  },
  {
    id: "garbage-collection-schedules",
    category: "Schedules",
    question: "How can residents view garbage collection schedules?",
    answer:
      "Collection schedules are publicly available on both your Resident Dashboard and the Collection Schedules page (/schedules). Schedules are organized by barangay and specify the designated day of the week, collection time window, and assigned municipal collection truck.",
  },
  {
    id: "how-to-reset-password",
    category: "Account & Security",
    question: "How can residents reset their passwords?",
    answer:
      "If you are signed in, you can update your password directly in Account Settings (/settings) under 'Password & Security'. If you forgot your password, go to the Sign In page (/login), click 'Forgot password?', enter your registered email, and follow the password reset link sent to your inbox.",
  },
  {
    id: "how-to-contact-menr",
    category: "General",
    question: "How can residents contact the MENR Office?",
    answer: (
      <div>
        <p style={{ margin: "0 0 8px" }}>
          Residents requiring assistance, document submission, or in-person consultation are encouraged to visit the MENR Office during regular operating hours:
        </p>
        <p style={{ margin: "0 0 6px" }}>
          <strong>Location:</strong> {MENR_OFFICE_INFO.address}
        </p>
        <p style={{ margin: "0 0 6px" }}>
          <strong>Operating Hours:</strong> {MENR_OFFICE_INFO.hours}
        </p>
        <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: "12.5px", lineHeight: 1.5 }}>
          {MENR_OFFICE_INFO.emergencyNote}
        </p>
      </div>
    ),
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    "what-is-ecoguard": true,
  });

  const categories = ["All", "General", "Complaints", "Permits", "Schedules", "Account & Security"];

  const filtered = FAQ_LIST.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof item.answer === "string" &&
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  function toggleItem(id: string) {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  return (
    <div className="support-page-container">
      {/* Navigation & Header */}
      <div className="support-header">
        <Link href="/support" className="button secondary sm">
          <ArrowLeft size={15} aria-hidden="true" /> Back to Support Hub
        </Link>
        <span className="eyebrow" style={{ margin: 0 }}>MABINI, BATANGAS • KNOWLEDGE BASE</span>
      </div>

      <div className="support-hero">
        <div className="support-hero-badge">
          <CircleHelp size={16} aria-hidden="true" />
          <span>Resident Guidance</span>
        </div>
        <h1>Frequently Asked Questions</h1>
        <p>
          Everything you need to know about using EcoGuard for environmental complaints, permit applications, and municipal services in Mabini.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="faq-filter-bar">
        <div className="faq-search-wrapper">
          <Search size={16} className="faq-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or keywords (e.g. permit, dumping, password)..."
            aria-label="Search FAQs"
            className="faq-search-input"
          />
        </div>

        <div className="faq-category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`faq-pill ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="faq-accordion-container">
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "36px 20px" }}>
            <CircleHelp size={32} style={{ color: "var(--text-secondary)", margin: "0 auto 12px" }} />
            <h3 style={{ margin: "0 0 6px", color: "var(--dark-forest)" }}>No matching questions found</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
              Try searching for different keywords or select &quot;All&quot; categories.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isOpen = Boolean(openIds[item.id]);

            return (
              <div key={item.id} className={`faq-accordion-item ${isOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="faq-accordion-trigger"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                >
                  <span className="faq-question-text">
                    <span className="faq-category-tag">{item.category}</span>
                    <strong>{item.question}</strong>
                  </span>
                  <ChevronDown
                    size={18}
                    className={`faq-chevron ${isOpen ? "rotated" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div id={`faq-answer-${item.id}`} className="faq-accordion-content" role="region">
                    <div className="faq-answer-inner">{item.answer}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Need more help banner */}
      <div className="card" style={{ marginTop: "32px", textAlign: "center", padding: "24px" }}>
        <h3 style={{ margin: "0 0 8px", color: "var(--dark-forest)" }}>Still have questions?</h3>
        <p style={{ margin: "0 0 16px", color: "var(--text-secondary)", fontSize: "13.5px" }}>
          You can interact with our AI Assistant in real time or visit the MENR Office at the Mabini Municipal Hall.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/dashboard" className="button green sm">
            Open AI Assistant
          </Link>
          <Link href="/support" className="button secondary sm">
            View Office Details
          </Link>
        </div>
      </div>
    </div>
  );
}
