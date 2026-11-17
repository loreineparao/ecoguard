export type GeminiClassification =
  | "illegal_dumping"
  | "tree_cutting"
  | "complaint_status"
  | "collection_schedule"
  | "general_inquiry"
  | "unknown";

export type GeminiModule =
  | "complaint"
  | "permit"
  | "complaint_status"
  | "collection_schedule"
  | "general_inquiry"
  | "unknown";

export type GeminiResult = {
  module: GeminiModule;
  classification: GeminiClassification;
  message: string;
};

/**
 * Determines whether the user's message is in Filipino / Tagalog / Taglish.
 */
export function isFilipinoOrTaglish(text: string): boolean {
  const lower = text.toLowerCase();
  const filipinoTokens = [
    "pano",
    "paano",
    "ano",
    "saan",
    "kailan",
    "bakit",
    "meron",
    "wala",
    "namin",
    "natin",
    "kami",
    "tayo",
    "kayo",
    "sila",
    "ako",
    "ikaw",
    "siya",
    "mga",
    "nang",
    "para",
    "dito",
    "doon",
    "dyan",
    "eto",
    "ito",
    "yan",
    "iyon",
    "basura",
    "tapon",
    "nagtapon",
    "puno",
    "putol",
    "reklamo",
    "sumbong",
    "hakot",
    "oras",
    "araw",
    "bahay",
    "lugar",
    "po",
    "opo",
    "ho",
    "oho",
    "ba",
    "naman",
    "kasi",
    "kaya",
    "lang",
    "din",
    "rin",
    "daw",
    "raw",
    "pala",
    "sana",
    "nga",
  ];

  for (const token of filipinoTokens) {
    const regex = new RegExp(`\\b${token}\\b`, "i");
    if (regex.test(lower)) return true;
  }

  return /\b(mag-|nag-|pag-|um-|in-|an-)/i.test(lower);
}

/**
 * Provides deterministic, accurate guidance aligned strictly with EcoGuard's scope
 * for the Municipality of Mabini, Batangas. Used as an instant fallback whenever the external
 * AI API is unavailable, busy (503), rate-limited, or timing out.
 */
export function getFallbackGuidance(concern: string): GeminiResult {
  const lower = concern.toLowerCase().trim();
  const isFilipino = isFilipinoOrTaglish(lower);

  // 1. Complaint Submission / How to Submit
  if (
    /(pano|paano|how).*submit.*(complaint|report)|(pano|paano|how).*mag.*(submit|file|reklamo)|submit.*complaint|file.*complaint|mag.*reklamo|mag.*sumbong/i.test(
      lower
    )
  ) {
    const message = isFilipino
      ? "Para mag-submit ng complaint ukol sa illegal dumping sa Mabini, sundin lamang ang 3 simpleng hakbang:\n\n1. **Ilarawan ang Insidente**: Ibigay ang detalye ukol sa uri ng basura at kaganapan.\n2. **I-tag ang Lokasyon**: Gamitin ang GPS capture button o tukuyin ang barangay sa Mabini upang madaling matunton ng MENR inspector ang lugar.\n3. **Mag-attach ng Litrato (Opsyonal)**: Mag-upload ng larawan ng basura bilang ebidensya.\n\nPumunta sa **Submit Complaint** form (`/complaints/new`) para opisyal na mai-file ang iyong ulat sa MENR Office."
      : "To submit an illegal dumping complaint in Mabini, please follow these 3 steps:\n\n1. **Describe the Incident**: Provide clear details regarding the dumped waste.\n2. **Pin the Location**: Use the GPS capture button or specify the Mabini barangay so MENR inspectors can locate the site quickly.\n3. **Attach Photo Evidence (Optional)**: Upload photos of the illegal dumping site.\n\nPlease open the **Submit Complaint** form (`/complaints/new`) to officially file your report with the MENR Office.";

    return {
      module: "complaint",
      classification: "illegal_dumping",
      message,
    };
  }

  // 2. Complaint Status Tracking
  if (/(status|nasaan|saan.*makikita|track|follow.*up|tingnan.*complaint)/i.test(lower)) {
    const message = isFilipino
      ? "Maaari mong subaybayan ang live status ng iyong mga nai-file na reklamo sa pahinang **My Complaints** (`/complaints`). Dito makikita kung ang iyong ulat ay *Pending*, *Under Review*, *Dispatched* (may nakatalagang inspector), o *Resolved* na ng MENR Office."
      : "You can track the live status of all your submitted environmental complaints on the **My Complaints** page (`/complaints`). There you will see whether your report is *Pending*, *Under Review*, *Dispatched* to an inspector, or *Resolved*.";

    return {
      module: "complaint_status",
      classification: "complaint_status",
      message,
    };
  }

  // 3. Tree Cutting Permit
  if (/(tree|puno|putol|cutting|permit)/i.test(lower)) {
    const message = isFilipino
      ? "Para sa aplikasyon ng Tree Cutting Permit sa Bayan ng Mabini, ihanda ang mga sumusunod na requirements bago magputol ng puno:\n\n1. **Barangay Clearance** (nagpapatunay na walang tumututol sa barangay)\n2. **Katibayan ng Pagmamay-ari ng Lupa** (Land Title o Tax Declaration, o Pahintulot mula sa may-ari)\n3. **Mga Litrato ng Puno** na puputulin\n4. **Makatuwirang Dahilan** (hal. delikado sa kuryente o mga gusali)\n\nIsumite ang inyong aplikasyon sa **Tree Cutting Permit** form (`/permits/new`) para sa opisyal na pagsusuri ng MENR Office."
      : "To apply for a Tree Cutting Permit in the Municipality of Mabini, prepare the following documentary requirements:\n\n1. **Barangay Clearance** certifying no objection\n2. **Proof of Land Ownership** (Land Title / Tax Declaration or Owner's Written Consent)\n3. **Clear Photos of the Tree(s)** to be cut\n4. **Valid Justification** (e.g. safety hazard to structures or power lines)\n\nPlease submit your application via the **Tree Cutting Permit** form (`/permits/new`) for MENR evaluation.";

    return {
      module: "permit",
      classification: "tree_cutting",
      message,
    };
  }

  // 4. Garbage Collection Schedule (checked before general waste dumping)
  if (
    /(schedule|hakot|koleksyon|collection|truck|trak)/i.test(lower) ||
    (lower.includes("kailan") &&
      (lower.includes("schedule") ||
        lower.includes("collection") ||
        lower.includes("garbage") ||
        lower.includes("basura")))
  ) {
    const message = isFilipino
      ? "Ang mga opisyal na iskedyul ng pangongolekta ng basura sa bawat barangay ng Mabini ay matatagpuan sa **Collection Schedules** section ng EcoGuard portal. Regular na umiikot ang mga garbage truck ng MENR ayon sa itinakdang araw at ruta."
      : "The official garbage collection schedules for each barangay in Mabini can be viewed in the **Collection Schedules** section of the EcoGuard portal. MENR collection trucks follow designated routes and days for each barangay.";

    return {
      module: "collection_schedule",
      classification: "collection_schedule",
      message,
    };
  }

  // 5. Illegal Dumping / Garbage Concern
  if (
    /(basura|tapon|nagtapon|dumping|kalat|dumi|waste|garbage|litter)/i.test(lower)
  ) {
    const message = isFilipino
      ? "Mahigpit na ipinagbabawal ang illegal dumping sa Bayan ng Mabini. Upang maaksyunan agad ito ng MENR Office, mangyaring i-report ang insidente sa pamamagitan ng **Submit Complaint** form (`/complaints/new`). Maaari mong ilakip ang GPS location at litrato ng basura bilang ebidensya."
      : "Illegal dumping is strictly prohibited in the Municipality of Mabini. To have this inspected by the MENR Office, please report it through the **Submit Complaint** form (`/complaints/new`), where you can attach GPS coordinates and photo evidence.";

    return {
      module: "complaint",
      classification: "illegal_dumping",
      message,
    };
  }

  // 6. General MENR Inquiry / Greeting
  const message = isFilipino
    ? "Magandang araw! Ako ang EcoGuard Resident Assistant ng Bayan ng Mabini (MENR Office). Matutulungan kita sa:\n- Pag-file ng reklamo sa **Illegal Dumping** (`/complaints/new`)\n- Pag-apply ng **Tree Cutting Permit** (`/permits/new`)\n- Pag-check sa **Status ng iyong Reklamo** (`/complaints`)\n- Pagtingin sa **Garbage Collection Schedule**\n\nAno po ang inyong maipaglilingkod o katanungan?"
    : "Hello! I am your EcoGuard Resident Assistant for the Municipality of Mabini MENR Office. I can assist you with:\n- Reporting **Illegal Dumping** (`/complaints/new`)\n- Applying for a **Tree Cutting Permit** (`/permits/new`)\n- Checking your **Complaint Status** (`/complaints`)\n- Viewing **Garbage Collection Schedules**\n\nHow can I assist you with Mabini's environmental services today?";

  return {
    module: "general_inquiry",
    classification: "general_inquiry",
    message,
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
    "general_inquiry",
    "unknown",
  ];

  const validClassifications: GeminiClassification[] = [
    "illegal_dumping",
    "tree_cutting",
    "complaint_status",
    "collection_schedule",
    "general_inquiry",
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