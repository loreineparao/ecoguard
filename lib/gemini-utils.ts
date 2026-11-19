import {
  evaluateMessageScope,
  getOutOfScopeRefusal,
  isFilipinoOrTaglish,
  type ChatHistoryItem,
} from "./gemini-scope";

export { isFilipinoOrTaglish };

export type GeminiClassification =
  | "illegal_dumping"
  | "tree_cutting"
  | "complaint_status"
  | "collection_schedule"
  | "account_assistance"
  | "general_inquiry"
  | "out_of_scope"
  | "unknown";

export type GeminiModule =
  | "complaint"
  | "permit"
  | "complaint_status"
  | "collection_schedule"
  | "account"
  | "general_inquiry"
  | "out_of_scope"
  | "unknown";

export type GeminiResult = {
  module: GeminiModule;
  classification: GeminiClassification;
  message: string;
};

/**
 * Provides deterministic, accurate guidance aligned strictly with EcoGuard's scope
 * for the Municipality of Mabini, Batangas. Used as an instant fallback whenever the external
 * AI API is unavailable, busy (503), rate-limited, timing out, or when pre-evaluating out-of-scope queries.
 */
export function getFallbackGuidance(
  concern: string,
  history?: ChatHistoryItem[]
): GeminiResult {
  const trimmed = concern.trim();
  const lower = trimmed.toLowerCase();
  const isFilipino = isFilipinoOrTaglish(lower);

  // 1. Evaluate Scope First
  const scopeCheck = evaluateMessageScope(trimmed, history);

  if (scopeCheck.category === "out_of_scope") {
    return {
      module: "out_of_scope",
      classification: "out_of_scope",
      message:
        scopeCheck.refusalMessage ||
        getOutOfScopeRefusal(isFilipino, scopeCheck.reason),
    };
  }

  // 2. Account Assistance (Registration, Login, Password Reset)
  if (
    /(login|log[\s-]?in|sign[\s-]?in|register|sign[\s-]?up|create\s+account|password|reset\s+password|nakalimutan\s+ang\s+password|mag-?login|mag-?register)/i.test(
      lower
    )
  ) {
    let message = "";
    if (/(password|reset)/i.test(lower)) {
      message = isFilipino
        ? "Para mag-reset ng password sa EcoGuard, pumunta lamang sa [Reset Password](/auth/reset-password) page. Ilagay ang iyong rehistradong email address at may ipapadalang recovery link upang makapagtala ng bagong password."
        : "To reset your EcoGuard account password, please navigate to the [Reset Password](/auth/reset-password) page. Enter your registered email address to receive password reset instructions.";
    } else if (/(register|sign[\s-]?up|create\s+account|gumawa\s+ng\s+account)/i.test(lower)) {
      message = isFilipino
        ? "Maaari kang lumikha ng bagong resident account sa pamamagitan ng [Create Account](/register). Ilagay ang iyong pangalan, email address, contact number, at barangay sa Mabini upang maging opisyal na Verified Resident."
        : "You can create a new EcoGuard resident account on the [Create Account](/register) page. Provide your full name, email address, contact information, and Mabini barangay to access resident services.";
    } else {
      message = isFilipino
        ? "Maaari kang mag-log in sa EcoGuard Resident Portal sa [Login](/login) page gamit ang iyong rehistradong email at password."
        : "You can access your account through the [Login](/login) page using your registered email address and password.";
    }

    return {
      module: "account",
      classification: "account_assistance",
      message,
    };
  }

  // 3. Contextual Follow-Up Handling
  if (scopeCheck.category === "in_scope_followup" && history && history.length > 0) {
    const recentContext = history
      .slice(-4)
      .map((h) => h.content.toLowerCase())
      .join(" ");

    if (/(tree|puno|cutting|permit)/i.test(recentContext)) {
      const message = isFilipino
        ? "Para sa Tree Cutting Permit sa Mabini, ang mga kailangang dokumento ay:\n\n1. **Barangay Clearance** (nagpapatunay na walang tumututol sa komunidad).\n2. **Katibayan ng Pagmamay-ari ng Lupa** o pahintulot (Land Title, Tax Declaration, o Notarized Consent).\n3. **Mga Litrato ng Puno** na puputulin o ititrim.\n4. **Makatuwirang Dahilan** para sa pagputol (hal. banta sa gusali o linya ng kuryente).\n\nIsumite ang mga ito sa [Tree Cutting Permit](/permits/new) application form."
        : "For a Tree-Cutting Permit in Mabini, the required documents are:\n\n1. **Barangay clearance** certifying no community objection.\n2. **Proof of land ownership** (Land Title / Tax Declaration) or owner's consent.\n3. **Clear photographs** of the tree(s) involved.\n4. **A valid justification** (e.g., safety hazard to structures or power lines).\n\nYou can submit these directly via [Tree Cutting Permit](/permits/new).";

      return {
        module: "permit",
        classification: "tree_cutting",
        message,
      };
    }

    if (/(dumping|basura|complaint|reklamo)/i.test(recentContext)) {
      const message = isFilipino
        ? "Sa pag-submit ng complaint sa illegal dumping, kinakailangan ang:\n\n1. Deskripsyon ng basura at insidente.\n2. Lokasyon o barangay sa Mabini (maaaring gamitin ang GPS button).\n3. Litrato bilang ebidensya (opsyonal pero makakatulong).\n\nI-file ang reklamo sa [Submit Complaint](/complaints/new)."
        : "When filing an illegal dumping complaint, please prepare:\n\n1. Description of the waste incident.\n2. Mabini barangay location (or GPS coordinates).\n3. Photo evidence (optional but recommended).\n\nSubmit your report via [Submit Complaint](/complaints/new).";

      return {
        module: "complaint",
        classification: "illegal_dumping",
        message,
      };
    }
  }

  // 4. Complaint Submission / How to Submit
  if (
    /(pano|paano|how).*submit.*(complaint|report)|(pano|paano|how).*mag.*(submit|file|reklamo)|submit.*complaint|file.*complaint|mag.*reklamo|mag.*sumbong/i.test(
      lower
    )
  ) {
    const message = isFilipino
      ? "Para mag-submit ng complaint ukol sa illegal dumping sa Mabini, sundin lamang ang 3 simpleng hakbang:\n\n1. **Ilarawan ang Insidente**: Ibigay ang detalye ukol sa uri ng basura at kaganapan.\n2. **I-tag ang Lokasyon**: Gamitin ang GPS capture button o tukuyin ang barangay sa Mabini upang madaling matunton ng MENR inspector ang lugar.\n3. **Mag-attach ng Litrato (Opsyonal)**: Mag-upload ng larawan ng basura bilang ebidensya.\n\nBuksan ang **Resident Portal** at piliin ang [Submit Complaint](/complaints/new) para opisyal na mai-file ang iyong ulat sa MENR Office. Maaari mong subaybayan ang aksyon sa [My Complaints](/complaints)."
      : "To submit an illegal dumping complaint in Mabini, please follow these 3 steps:\n\n1. **Describe the Incident**: Provide clear details regarding the dumped waste.\n2. **Pin the Location**: Use the GPS capture button or specify the Mabini barangay so MENR inspectors can locate the site quickly.\n3. **Attach Photo Evidence (Optional)**: Upload photos of the illegal dumping site.\n\nPlease open the **Resident Portal** and select [Submit Complaint](/complaints/new) to officially file your report with the MENR Office. You can track resolution under [My Complaints](/complaints).";

    return {
      module: "complaint",
      classification: "illegal_dumping",
      message,
    };
  }

  // 5. Complaint Status Tracking
  if (/(status|nasaan|saan.*makikita|track|follow.*up|tingnan.*complaint)/i.test(lower)) {
    const message = isFilipino
      ? "Maaari mong subaybayan ang live status ng iyong mga nai-file na reklamo sa [My Complaints](/complaints). Dito makikita kung ang iyong ulat ay *Pending*, *Under Review*, *Dispatched* (may nakatalagang inspector), o *Resolved* na ng MENR Office."
      : "You can track the live status of all your submitted environmental complaints under [My Complaints](/complaints). There you will see whether your report is *Pending*, *Under Review*, *Dispatched* to an inspector, or *Resolved*.";

    return {
      module: "complaint_status",
      classification: "complaint_status",
      message,
    };
  }

  // 6. Tree Cutting Permit
  if (/(tree|puno|putol|cutting|permit)/i.test(lower)) {
    const message = isFilipino
      ? "Magandang araw po! Para mag-apply ng Tree Cutting Permit sa Bayan ng Mabini, ihanda ang mga sumusunod na kinakailangang dokumento:\n\n1. **Barangay Clearance** (nagpapatunay na walang tumututol sa komunidad).\n2. **Katibayan ng Pagmamay-ari ng Lupa** o pahintulot (Land Title, Tax Declaration, o Consent mula sa may-ari).\n3. **Mga Litrato ng Puno** na puputulin.\n4. **Makatuwirang Dahilan** para sa pagputol (halimbawa: banta sa kaligtasan, linya ng kuryente, o gusali).\n\nMangyaring i-verify ang kasalukuyang mga kinakailangan sa MENR Office o sa Tree Cutting Permit application form.\n\nPara isumite ang inyong aplikasyon, buksan ang **Resident Portal**, piliin ang [Tree Cutting Permit](/permits/new), punan ang application form, i-attach ang mga dokumento, at isumite ang inyong kahilingan.\n\nMaaari ninyong subaybayan ang estado ng aplikasyon sa [My Applications](/permits)."
      : "Hello! To apply for a tree-cutting permit in Mabini, Batangas, please prepare the required documents, which may include:\n\n1. **Barangay clearance** certifying no objection.\n2. **Proof of land ownership** or appropriate authorization (Land Title / Tax Declaration / Owner's Consent).\n3. **Photos of the tree or trees** involved.\n4. **A valid reason** for the request (e.g., safety hazard to structures or power lines).\n\nPlease verify the current requirements with the MENR Office or the Tree Cutting Permit application form.\n\nTo submit your application, open the **Resident Portal**, select [Tree Cutting Permit](/permits/new), complete the application form, attach the required documents, and submit your request.\n\nYou can track your application status through [My Applications](/permits).";

    return {
      module: "permit",
      classification: "tree_cutting",
      message,
    };
  }

  // 7. Garbage Collection Schedule
  if (
    /(schedule|hakot|koleksyon|collection|truck|trak)/i.test(lower) ||
    (lower.includes("kailan") &&
      (lower.includes("schedule") ||
        lower.includes("collection") ||
        lower.includes("garbage") ||
        lower.includes("basura")))
  ) {
    const message = isFilipino
      ? "Ang mga opisyal na iskedyul ng pangongolekta ng basura sa bawat barangay ng Mabini ay matatagpuan sa [Garbage Collection Schedules](/schedules) section ng EcoGuard portal. Regular na umiikot ang mga garbage truck ng MENR ayon sa itinakdang araw at ruta para sa 34 na barangay."
      : "The official garbage collection schedules for each barangay in Mabini can be viewed in the [Garbage Collection Schedules](/schedules) section of the EcoGuard portal. MENR collection trucks follow designated routes and days across all 34 barangays.";

    return {
      module: "collection_schedule",
      classification: "collection_schedule",
      message,
    };
  }

  // 8. Illegal Dumping / Garbage Concern
  if (
    /(basura|tapon|nagtapon|dumping|kalat|dumi|waste|garbage|litter)/i.test(lower)
  ) {
    const message = isFilipino
      ? "Mahigpit na ipinagbabawal ang illegal dumping sa Bayan ng Mabini. Upang maaksyunan agad ito ng MENR Office, mangyaring buksan ang **Resident Portal** at i-report ang insidente sa pamamagitan ng [Submit Complaint](/complaints/new). Maaari mong ilakip ang GPS location at litrato ng basura bilang ebidensya. Masusubaybayan ang aksyon sa [My Complaints](/complaints)."
      : "Illegal dumping is strictly prohibited in the Municipality of Mabini. To have this inspected by the MENR Office, please open the **Resident Portal** and report it through [Submit Complaint](/complaints/new), where you can attach GPS coordinates and photo evidence. You can track progress under [My Complaints](/complaints).";

    return {
      module: "complaint",
      classification: "illegal_dumping",
      message,
    };
  }

  // 9. EcoGuard / MENR General Inquiries & Greetings
  if (
    /(ecoguard|menr|mabini|ano\s+ang\s+ecoguard|what\s+is\s+ecoguard|serbisyo|services|tulong|help|hi\b|hello\b|hey\b|kumusta\b|magandang)/i.test(
      lower
    )
  ) {
    const message = isFilipino
      ? "Magandang araw! Ako ang EcoGuard AI Assistant para sa Bayan ng Mabini (MENR Office). Matutulungan kita sa:\n- Pag-report ng illegal dumping sa [Submit Complaint](/complaints/new)\n- Pag-apply ng [Tree Cutting Permit](/permits/new)\n- Pagsuri ng estado ng reklamo sa [My Complaints](/complaints)\n- Pagtingin sa [Garbage Collection Schedules](/schedules)\n- Pag-access sa inyong [Account Settings](/settings)\n\nAno po ang inyong maipaglilingkod ukol sa mga serbisyong pangkalikasan?"
      : "Hello! I am your EcoGuard AI Assistant for the Municipality of Mabini MENR Office. I can assist you with:\n- Reporting illegal dumping under [Submit Complaint](/complaints/new)\n- Applying for a [Tree Cutting Permit](/permits/new)\n- Tracking your complaints under [My Complaints](/complaints)\n- Viewing [Garbage Collection Schedules](/schedules)\n- Managing your resident [Account Settings](/settings)\n\nHow can I assist you with Mabini's environmental services today?";

    return {
      module: "general_inquiry",
      classification: "general_inquiry",
      message,
    };
  }

  // 10. Anything else is outside EcoGuard scope -> Polite refusal
  return {
    module: "out_of_scope",
    classification: "out_of_scope",
    message: getOutOfScopeRefusal(isFilipino, "general_knowledge_unrelated"),
  };
}

/**
 * Validates the parsed JSON output from the Gemini model.
 */
export function validateGeminiResult(result: unknown): result is GeminiResult {
  if (!result || typeof result !== "object") {
    return false;
  }

  const data = result as Record<string, unknown>;

  const validModules: GeminiModule[] = [
    "complaint",
    "permit",
    "complaint_status",
    "collection_schedule",
    "account",
    "general_inquiry",
    "out_of_scope",
    "unknown",
  ];

  const validClassifications: GeminiClassification[] = [
    "illegal_dumping",
    "tree_cutting",
    "complaint_status",
    "collection_schedule",
    "account_assistance",
    "general_inquiry",
    "out_of_scope",
    "unknown",
  ];

  if (
    typeof data.module !== "string" ||
    !validModules.includes(data.module as GeminiModule)
  ) {
    return false;
  }

  if (
    typeof data.classification !== "string" ||
    !validClassifications.includes(data.classification as GeminiClassification)
  ) {
    return false;
  }

  if (typeof data.message !== "string" || data.message.trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * Cleans markdown code fences and extraneous tokens from model text output.
 */
export function cleanJsonOutput(rawText: string): string {
  let text = rawText.trim();
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1).trim();
  }
  return text;
}
