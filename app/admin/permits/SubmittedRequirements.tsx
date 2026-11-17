import { FileCheck2, FileText } from "lucide-react";

type SubmittedRequirementsProps = {
  requirements: unknown;
};

type RequirementItem = {
  key: string;
  label: string;
  status: string;
  statusType: "submitted" | "pending" | "missing" | "review";
};

const knownRequirementLabels: Record<string, string> = {
  land_title: "Land Title / Proof of Land Ownership",
  application_letter: "Formal Application Letter",
  barangay_clearance: "Barangay Environmental Clearance",
  resolution_no_objection: "Resolution Interposing No Objection",
  no_objection: "Resolution Interposing No Objection",
  resolution_interposing_no_objection: "Resolution Interposing No Objection",
  tree_photos: "Photos of the Trees",
  valid_id: "Valid Government ID",
  tree_location: "Tree Location / Sketch & Photos",
  tree_cutting_permit: "Tree Cutting Permit Application",
  site_photos: "Site & Tree Photos",
  denr_clearance: "DENR CENRO Clearance",
  homeowners_clearance: "Homeowners Association (HOA) Clearance",
  power_utility_clearance: "Electric Utility / Power Line Clearance",
  inspection_report: "On-Site MENR Inspection Report",
  mayor_permit: "Mayor's Permit / LGU Clearance",
};

function formatRequirementLabel(rawKey: string): string {
  const normalized = rawKey.trim().toLowerCase();
  if (knownRequirementLabels[normalized]) {
    return knownRequirementLabels[normalized];
  }

  // Convert snake_case, kebab-case, or camelCase into clean Title Case
  return rawKey
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatus(rawStatus: unknown): {
  label: string;
  statusType: "submitted" | "pending" | "missing" | "review";
} {
  if (rawStatus === true) {
    return { label: "Submitted", statusType: "submitted" };
  }
  if (rawStatus === false) {
    return { label: "Missing", statusType: "missing" };
  }
  if (!rawStatus) {
    return { label: "Pending", statusType: "pending" };
  }

  const str = String(rawStatus).trim();
  const lower = str.toLowerCase();

  if (/submitted|uploaded|approved|verified|complete|yes/i.test(lower)) {
    return {
      label: lower === "submitted" ? "Submitted" : str,
      statusType: "submitted",
    };
  }

  if (/missing|rejected|declined|no|not submitted/i.test(lower)) {
    return {
      label: lower === "missing" ? "Missing" : str,
      statusType: "missing",
    };
  }

  if (/review|under review|evaluating/i.test(lower)) {
    return {
      label: "Under Review",
      statusType: "review",
    };
  }

  return {
    label: str.charAt(0).toUpperCase() + str.slice(1),
    statusType: "pending",
  };
}

function parseRequirements(requirements: unknown): RequirementItem[] {
  if (!requirements) return [];

  let data = requirements;
  if (typeof requirements === "string") {
    try {
      data = JSON.parse(requirements);
    } catch {
      return [
        {
          key: "general-req",
          label: formatRequirementLabel(requirements),
          status: "Submitted",
          statusType: "submitted",
        },
      ];
    }
  }

  if (Array.isArray(data)) {
    return data.map((item, index) => {
      if (typeof item === "string") {
        return {
          key: `req-${index}`,
          label: formatRequirementLabel(item),
          status: "Submitted",
          statusType: "submitted",
        };
      }
      if (item && typeof item === "object") {
        const itemObj = item as Record<string, unknown>;
        const name = String(
          itemObj.name || itemObj.title || itemObj.requirement || `Requirement ${index + 1}`
        );
        const statusInfo = formatStatus(itemObj.status ?? "submitted");
        return {
          key: String(itemObj.id || `req-${index}`),
          label: formatRequirementLabel(name),
          status: statusInfo.label,
          statusType: statusInfo.statusType,
        };
      }
      return {
        key: `req-${index}`,
        label: `Requirement ${index + 1}`,
        status: "Submitted",
        statusType: "submitted",
      };
    });
  }

  if (data && typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    return entries.map(([key, value]) => {
      const statusInfo = formatStatus(value);
      return {
        key,
        label: formatRequirementLabel(key),
        status: statusInfo.label,
        statusType: statusInfo.statusType,
      };
    });
  }

  return [];
}

export default function SubmittedRequirements({
  requirements,
}: SubmittedRequirementsProps) {
  const items = parseRequirements(requirements);

  return (
    <div className="submitted-requirements-panel">
      <div className="submitted-requirements-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="requirements-icon-badge">
            <FileText size={15} aria-hidden="true" />
          </span>
          <strong style={{ color: "var(--dark-forest)", fontSize: "13px" }}>
            Submitted Requirements
          </strong>
        </div>
        <span className="hint" style={{ fontSize: "11.5px" }}>
          {items.length === 0
            ? "No requirements filed"
            : `${items.length} ${items.length === 1 ? "requirement item" : "requirement items"}`}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="requirements-empty">
          <p className="hint" style={{ margin: 0 }}>
            No documentary requirements were specified for this application.
          </p>
        </div>
      ) : (
        <div className="requirements-grid">
          {items.map((item) => {
            const badgeClass =
              item.statusType === "submitted"
                ? "badge resolved"
                : item.statusType === "missing"
                  ? "badge rejected"
                  : item.statusType === "review"
                    ? "badge under-review"
                    : "badge pending";

            return (
              <div key={item.key} className="requirement-item-card">
                <div className="requirement-left">
                  <div className="requirement-doc-icon">
                    <FileCheck2 size={16} aria-hidden="true" />
                  </div>
                  <div>
                    <strong className="requirement-name">{item.label}</strong>
                    <span className="requirement-subtext">MENR Documentary Requirement</span>
                  </div>
                </div>

                <div className="requirement-right">
                  <span className={badgeClass}>{item.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}