/**
 * EcoGuard AI Assistant - Scope Enforcement Module
 *
 * Centralizes scope definitions, intent classification, out-of-scope detection,
 * prompt injection prevention, and standardized polite refusal responses
 * for the Municipality of Mabini MENR Office.
 */

export type ScopeCategory =
  | "in_scope"
  | "in_scope_followup"
  | "out_of_scope"
  | "ambiguous";

export type OutOfScopeReason =
  | "math"
  | "pickup_lines"
  | "jokes_entertainment"
  | "weather"
  | "homework_coding"
  | "roleplay_prompt_injection"
  | "general_knowledge_unrelated";

export interface ScopeCheckResult {
  category: ScopeCategory;
  reason?: OutOfScopeReason;
  matchedTopic?: string;
  refusalMessage?: string;
}

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

/**
 * Determines whether text is written in Filipino / Tagalog / Taglish.
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
    "mayroon",
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
    "hindi",
    "huwag",
    "bawal",
    "puwede",
    "pwede",
  ];

  for (const token of filipinoTokens) {
    const regex = new RegExp(`\\b${token}\\b`, "i");
    if (regex.test(lower)) return true;
  }

  return /\b(mag-|nag-|pag-|um-|in-|an-)/i.test(lower);
}

/**
 * Generates standardized, polite refusal responses strictly adhering to EcoGuard specifications.
 */
export function getOutOfScopeRefusal(
  isFilipino: boolean,
  reason?: OutOfScopeReason
): string {
  if (isFilipino) {
    if (reason === "pickup_lines") {
      return "Pasensya na po, hindi po saklaw ng EcoGuard AI Assistant ang paggawa ng pickup lines o mga bagay na walang kinalaman sa sistema.\n\nNarito po ako upang tumulong sa mga katanungan tungkol sa EcoGuard, environmental complaints, tree-cutting permits, at garbage collection services.";
    }
    if (reason === "math") {
      return "Pasensya na po, ang EcoGuard AI Assistant ay para lamang sa mga katanungan tungkol sa EcoGuard at mga serbisyong pangkalikasan ng MENR Office sa Mabini, Batangas.\n\nMaaari po kitang tulungan sa environmental complaints, tree-cutting permits, garbage collection schedules, at paggamit ng EcoGuard portal.";
    }
    if (reason === "jokes_entertainment") {
      return "Pasensya na po, hindi po saklaw ng EcoGuard AI Assistant ang pagbibigay ng jokes o entertainment.\n\nNarito po ako upang magbigay ng opisyal na gabay ukol sa mga reklamo sa illegal dumping, tree-cutting permits, at garbage collection schedules sa Bayan ng Mabini.";
    }
    if (reason === "weather") {
      return "Pasensya na po, hindi po saklaw ng EcoGuard AI Assistant ang weather forecasting o lagay ng panahon.\n\nNarito po ako upang tumulong sa mga serbisyong pangkalikasan ng MENR Office tulad ng illegal dumping complaints, tree-cutting permits, at garbage collection schedules.";
    }
    return "Pasensya na po, ang EcoGuard AI Assistant ay para lamang sa mga katanungan tungkol sa EcoGuard at mga serbisyong pangkalikasan ng MENR Office sa Mabini, Batangas.\n\nMaaari po kitang tulungan sa environmental complaints (tulad ng illegal dumping), tree-cutting permits, garbage collection schedules, at paggamit ng EcoGuard portal.";
  }

  // English Refusals
  if (reason === "pickup_lines") {
    return "I apologize, but creating pickup lines or non-environmental entertainment is outside the scope of the EcoGuard AI Assistant.\n\nI am here to assist you with inquiries regarding EcoGuard, environmental complaints, tree-cutting permits, and garbage collection services in Mabini, Batangas.";
  }
  if (reason === "math") {
    return "I apologize, but the EcoGuard AI Assistant is dedicated exclusively to questions regarding EcoGuard and MENR Office environmental services in Mabini, Batangas.\n\nI can help you with environmental complaints, tree-cutting permits, garbage collection schedules, and using the EcoGuard portal.";
  }
  if (reason === "jokes_entertainment") {
    return "I apologize, but entertainment requests and telling jokes are outside the scope of the EcoGuard AI Assistant.\n\nI am dedicated to providing official guidance for environmental complaints, tree-cutting permits, and garbage collection schedules in the Municipality of Mabini.";
  }
  if (reason === "weather") {
    return "I apologize, but weather forecasting is outside the EcoGuard chatbot's supported functions.\n\nI can assist you with official MENR services such as illegal dumping complaints, tree-cutting permit applications, and garbage collection schedules.";
  }
  return "I apologize, but the EcoGuard AI Assistant is dedicated exclusively to questions regarding EcoGuard and MENR Office environmental services in Mabini, Batangas.\n\nI can assist you with reporting environmental complaints (such as illegal dumping), tree-cutting permit applications, garbage collection schedules, and navigating the EcoGuard resident portal.";
}

/**
 * Checks whether an incoming message violates EcoGuard's scope.
 * Detects prompt injections, math, pickup lines, jokes, weather, homework,
 * and preserves valid follow-ups from prior conversation context.
 */
export function evaluateMessageScope(
  message: string,
  history?: ChatHistoryItem[]
): ScopeCheckResult {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();
  const isFilipino = isFilipinoOrTaglish(lower);

  // 1. Check for prompt injection / role bypass overrides first
  if (
    /(ignore\s+(all\s+|your\s+|previous\s+)*instructions|forget\s+(all\s+|your\s+|the\s+)*instructions|forget\s+(the\s+)?menr|you\s+are\s+no\s+longer|pretend\s+(you\s+are|to\s+be)|act\s+as\s+a\s+(general|different|other)|developer\s+mode|dan\s+mode|jailbreak|bypass\s+(your\s+)?rules|reveal\s+(your\s+)?(system\s+)?prompt)/i.test(
      lower
    )
  ) {
    return {
      category: "out_of_scope",
      reason: "roleplay_prompt_injection",
      refusalMessage: getOutOfScopeRefusal(isFilipino, "roleplay_prompt_injection"),
    };
  }

  // 2. Explicit Pickup Line check (Must block even if combined with environmental terms)
  if (
    /(pick[\s-]?up\s+lines?|banat|hugot\b|ligaw\b|date\s+me\b|crush\s+kita\b)/i.test(
      lower
    )
  ) {
    return {
      category: "out_of_scope",
      reason: "pickup_lines",
      refusalMessage: getOutOfScopeRefusal(isFilipino, "pickup_lines"),
    };
  }

  // 3. Mathematics / Equations check (e.g. 1+1=?, 5*5, calculate, algebra)
  const isMathFormula =
    /^\s*[\d\(\)]+\s*[\+\-\*\/\^%×÷]\s*[\d\(\)]+.*$/i.test(lower) ||
    /^\s*\d+\s*[\+\-\*\/]\s*\d+\s*=?\s*\??\s*$/i.test(lower);

  const isMathKeywords =
    /\b(calculate|calculator|solve\s+(for\s+x|equation|math|formula)|algebra|calculus|trigonometry|pythagorean|square\s+root)\b/i.test(
      lower
    );

  if (isMathFormula || isMathKeywords) {
    return {
      category: "out_of_scope",
      reason: "math",
      refusalMessage: getOutOfScopeRefusal(isFilipino, "math"),
    };
  }

  // 4. Jokes & Entertainment check (Must block even if asking for eco jokes)
  if (
    /(tell\s+me\s+a\s+joke|mag-?joke\s+ka|give\s+me\s+a\s+joke|joke\s+naman|make\s+me\s+laugh|magpatawa|tula\b|poem|poetry|lyrics\b|kanta\b|awit\b|story\b|kwento\b|fairy\s+tale|riddle|bugtong)/i.test(
      lower
    )
  ) {
    return {
      category: "out_of_scope",
      reason: "jokes_entertainment",
      refusalMessage: getOutOfScopeRefusal(isFilipino, "jokes_entertainment"),
    };
  }

  // 5. Weather check
  if (
    /(what\s+is\s+the\s+weather|weather\s+today|panahon\s+ngayon|uulan\s+ba|forecast\s+today|heat\s+index\s+today|temperature\s+today)/i.test(
      lower
    )
  ) {
    return {
      category: "out_of_scope",
      reason: "weather",
      refusalMessage: getOutOfScopeRefusal(isFilipino, "weather"),
    };
  }

  // 6. Generic Homework / Coding check
  if (
    /(homework|assignment\b|solve\s+my\s+assignment|write\s+(a\s+)?(python|javascript|c\+\+|java|html|css)\s+(code|script)|debug\s+my\s+code)/i.test(
      lower
    )
  ) {
    return {
      category: "out_of_scope",
      reason: "homework_coding",
      refusalMessage: getOutOfScopeRefusal(isFilipino, "homework_coding"),
    };
  }

  // 7. Check for Direct In-Scope EcoGuard / MENR topics
  const hasComplaintKeywords =
    /(basura|tapon|nagtapon|dumping|kalat\b|dumi\b|waste\b|garbage\b|litter\b|trash\b|complaint|reklamo|sumbong|report|sunog|burning|polusyon|canal\b|kanal\b|estero\b|dagat\b|waterway)/i.test(
      lower
    );

  const hasPermitKeywords =
    /(tree|puno\b|punongkahoy|cut\b|cutting|putol|trim\b|trimming|permit|clearance|tax\s+declaration|land\s+title|hazard)/i.test(
      lower
    );

  const hasScheduleKeywords =
    /(schedule|hakot|koleksyon|collection|truck\b|trak\b|rota\b|kailan\s+kukunin|araw\s+ng\s+hakot|oras\s+ng\s+hakot)/i.test(
      lower
    );

  const hasStatusKeywords =
    /(status\b|nasaan\b|saan\s+(ko\s+)?makikita|track|follow[\s-]?up|update\b|pending|dispatched|resolved|inspector)/i.test(
      lower
    );

  const hasAccountKeywords =
    /(login|log[\s-]?in|sign[\s-]?in|register|sign[\s-]?up|create\s+account|password|reset|profile|avatar|portal|dashboard)/i.test(
      lower
    );

  const hasBrandKeywords =
    /(ecoguard|menr|mabini\b|batangas\b|munisipyo|munisipalidad)/i.test(lower);

  const isGreeting =
    /^(hi|hello|hey|kumusta|kamusta|magandang\s+(araw|umaga|hapon|gabi)|good\s+(morning|afternoon|evening)|mabuhay|salamat|thank\s+you|thanks)[\s!\.\?]*$/i.test(
      lower
    );

  if (
    hasComplaintKeywords ||
    hasPermitKeywords ||
    hasScheduleKeywords ||
    hasStatusKeywords ||
    hasAccountKeywords ||
    hasBrandKeywords ||
    isGreeting
  ) {
    return {
      category: "in_scope",
      matchedTopic: hasComplaintKeywords
        ? "complaint"
        : hasPermitKeywords
        ? "permit"
        : hasScheduleKeywords
        ? "schedule"
        : hasStatusKeywords
        ? "status"
        : hasAccountKeywords
        ? "account"
        : "general",
    };
  }

  // 8. Contextual Follow-Up Check
  // E.g., user asks "What documents do I need?" or "Ano ang mga kailangan?"
  const isFollowUpPattern =
    /(what\s+documents|mga\s+kailangan|requirements|dokumento|ano\s+ang\s+kailangan|saan\s+ipapasa|where\s+to\s+submit|how\s+long|gaano\s+katagal|magkano|how\s+much|fee|kailangan\s+ba|is\s+it\s+free|libre\s+ba|online\s+ba)/i.test(
      lower
    );

  if (isFollowUpPattern && history && history.length > 0) {
    const recentContext = history
      .slice(-4)
      .map((h) => h.content.toLowerCase())
      .join(" ");

    if (
      /(tree|puno|cutting|permit|clearance)/i.test(recentContext) ||
      /(dumping|basura|complaint|reklamo|report)/i.test(recentContext) ||
      /(schedule|hakot|collection|truck)/i.test(recentContext) ||
      /(account|login|portal|register)/i.test(recentContext)
    ) {
      return {
        category: "in_scope_followup",
        matchedTopic: "contextual_followup",
      };
    }
  }

  // 9. If query lacks in-scope markers and doesn't match a valid follow-up
  // Check for general knowledge / off-topic queries
  if (
    /(capital\s+of|who\s+is|president|recipe|how\s+to\s+cook|calories|horoscope|zodiac|bitcoin|crypto|stock\s+market|movie|celebrity|news\s+today)/i.test(
      lower
    )
  ) {
    return {
      category: "out_of_scope",
      reason: "general_knowledge_unrelated",
      refusalMessage: getOutOfScopeRefusal(isFilipino, "general_knowledge_unrelated"),
    };
  }

  // Ambiguous message that might still be a conversational inquiry
  return {
    category: "ambiguous",
  };
}

/**
 * Validates generated AI responses to prevent hallucinatory leaks
 * of out-of-scope content (e.g. math results, jokes, pickup lines).
 */
export function validateResponseScope(
  responseText: string,
  userQuery: string
): { isValid: boolean; sanitizedResponse: string } {
  const lowerResp = responseText.toLowerCase();
  const lowerQuery = userQuery.toLowerCase();
  const isFilipino = isFilipinoOrTaglish(lowerQuery);

  // If user query was math, response must not compute math answers
  if (
    /^\s*\d+\s*[\+\-\*\/]\s*\d+/i.test(lowerQuery) &&
    /(equals\s+\d+|is\s+\d+|sagot\s+ay\s+\d+|=\s*\d+)/i.test(lowerResp) &&
    !lowerResp.includes("EcoGuard")
  ) {
    return {
      isValid: false,
      sanitizedResponse: getOutOfScopeRefusal(isFilipino, "math"),
    };
  }

  // If user asked for pickup lines, response must not contain pickup lines
  if (
    /pick[\s-]?up\s+lines?/i.test(lowerQuery) &&
    !lowerResp.includes("hindi po saklaw") &&
    !lowerResp.includes("outside the scope")
  ) {
    return {
      isValid: false,
      sanitizedResponse: getOutOfScopeRefusal(isFilipino, "pickup_lines"),
    };
  }

  // If user asked for a joke, response must not tell a joke
  if (
    /(joke|make\s+me\s+laugh|magpatawa)/i.test(lowerQuery) &&
    !lowerResp.includes("hindi po saklaw") &&
    !lowerResp.includes("outside the scope")
  ) {
    return {
      isValid: false,
      sanitizedResponse: getOutOfScopeRefusal(isFilipino, "jokes_entertainment"),
    };
  }

  return {
    isValid: true,
    sanitizedResponse: responseText,
  };
}
