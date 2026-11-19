/**
 * EcoGuard Validation Utilities
 * Validates emails, passwords, and form inputs for resident registration and authentication.
 */

export type EmailValidationResult = {
  isValid: boolean;
  error: string | null;
  suggestion: string | null;
  suggestedEmail: string | null;
  sanitized: string;
  localPart: string | null;
  domain: string | null;
};

const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  // Gmail typos
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.comp": "gmail.com",
  "gmail.co": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmaik.com": "gmail.com",
  "gmeil.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmaul.com": "gmail.com",
  "gmaio.com": "gmail.com",
  "gmaiil.com": "gmail.com",
  "gmaill.con": "gmail.com",
  "gmail.vom": "gmail.com",
  "gmail.xom": "gmail.com",
  "gmail.dom": "gmail.com",
  "gmail.clm": "gmail.com",
  "gmail.cpm": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmail.com.com": "gmail.com",
  "gmail.com.ph": "gmail.com",
  "gmail.ph": "gmail.com",
  "gamil.con": "gmail.com",
  "gmial.con": "gmail.com",
  "gamil.co": "gmail.com",
  "gmial.co": "gmail.com",

  // Yahoo typos
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yahoo.comp": "yahoo.com",
  "yahoo.cpm": "yahoo.com",
  "yaho.co": "yahoo.com",
  "yaho.com.ph": "yahoo.com.ph",
  "yahoo.co.ph": "yahoo.com.ph",
  "yahooo.com.ph": "yahoo.com.ph",

  // Outlook typos
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlook.con": "outlook.com",
  "outlook.comp": "outlook.com",
  "outlook.co": "outlook.com",
  "otlook.com": "outlook.com",
  "outlokk.com": "outlook.com",
  "outlook.ph": "outlook.com",

  // Hotmail typos
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotamil.com": "hotmail.com",
  "hotmial.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmail.comp": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "hotmaik.com": "hotmail.com",

  // iCloud typos
  "iclud.com": "icloud.com",
  "icould.com": "icloud.com",
  "icloud.con": "icloud.com",
  "icloud.comp": "icloud.com",
  "iclou.com": "icloud.com",
};

/**
 * Validates an email address according to RFC standards and real-world TLD requirements.
 * Rejects incomplete, malformed, whitespace, unsupported characters, and known domain typos.
 * Detects common typos (e.g. gmail.comp -> gmail.com) and suggests the correct provider.
 * Works with custom, school (.edu.ph), government (.gov.ph), and organizational domains.
 */
export function validateEmail(email: string): EmailValidationResult {
  const sanitized = email.trim();

  if (!sanitized) {
    return {
      isValid: false,
      error: "Email address is required.",
      suggestion: null,
      suggestedEmail: null,
      sanitized,
      localPart: null,
      domain: null,
    };
  }

  // Reject internal whitespace
  if (/\s/.test(sanitized)) {
    return {
      isValid: false,
      error: "Email address cannot contain spaces.",
      suggestion: null,
      suggestedEmail: null,
      sanitized,
      localPart: null,
      domain: null,
    };
  }

  // RFC 5321 length limits
  if (sanitized.length > 254) {
    return {
      isValid: false,
      error: "Email address cannot exceed 254 characters.",
      suggestion: null,
      suggestedEmail: null,
      sanitized,
      localPart: null,
      domain: null,
    };
  }

  // Check for single '@' symbol
  const atParts = sanitized.split("@");
  if (atParts.length !== 2) {
    return {
      isValid: false,
      error: "Please enter a valid email address with a single '@' (e.g. resident@gmail.com).",
      suggestion: null,
      suggestedEmail: null,
      sanitized,
      localPart: null,
      domain: null,
    };
  }

  const [localPart, domainRaw] = atParts;
  const domain = domainRaw.toLowerCase();

  // Local part validation
  if (!localPart || localPart.length === 0 || localPart.length > 64) {
    return {
      isValid: false,
      error: "The username portion before '@' is invalid or empty.",
      suggestion: null,
      suggestedEmail: null,
      sanitized,
      localPart,
      domain,
    };
  }

  // Domain checks
  if (!domain || domain.length === 0) {
    return {
      isValid: false,
      error: "Email is missing a domain after '@' (e.g. gmail.com).",
      suggestion: null,
      suggestedEmail: null,
      sanitized,
      localPart,
      domain: null,
    };
  }

  if (domain.startsWith(".") || domain.endsWith(".")) {
    return {
      isValid: false,
      error: "Email domain cannot start or end with a dot (e.g. resident@gmail.com).",
      suggestion: null,
      suggestedEmail: null,
      sanitized,
      localPart,
      domain,
    };
  }

  if (domain.includes("..")) {
    return {
      isValid: false,
      error: "Email domain cannot contain consecutive dots.",
      suggestion: null,
      suggestedEmail: null,
      sanitized,
      localPart,
      domain,
    };
  }

  // Ensure domain contains at least one dot separating domain label and TLD
  const domainParts = domain.split(".");
  if (domainParts.length < 2) {
    return {
      isValid: false,
      error: "Email must include a top-level domain (e.g. .com, .org, or .ph).",
      suggestion: null,
      suggestedEmail: null,
      sanitized,
      localPart,
      domain,
    };
  }

  // Validate each domain segment syntax (alphanumeric and hyphens, not leading/trailing hyphen)
  for (const part of domainParts) {
    if (!part || part.startsWith("-") || part.endsWith("-") || !/^[a-zA-Z0-9-]+$/.test(part)) {
      return {
        isValid: false,
        error: "Email domain contains invalid characters or formatting.",
        suggestion: null,
        suggestedEmail: null,
        sanitized,
        localPart,
        domain,
      };
    }
  }

  // The Top-Level Domain (TLD) must be at least 2 alphabetic characters
  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-zA-Z]{2,24}$/.test(tld)) {
    return {
      isValid: false,
      error: "Email domain extension is incomplete or invalid (e.g. .com).",
      suggestion: null,
      suggestedEmail: null,
      sanitized,
      localPart,
      domain,
    };
  }

  // 1. Check exact dictionary of known email typos
  if (COMMON_DOMAIN_TYPOS[domain]) {
    const suggestedDomain = COMMON_DOMAIN_TYPOS[domain];
    return {
      isValid: false,
      error: `Please check your email domain. Did you mean ${suggestedDomain}?`,
      suggestion: suggestedDomain,
      suggestedEmail: `${localPart}@${suggestedDomain}`,
      sanitized,
      localPart,
      domain,
    };
  }

  // 2. Detect common provider prefix with invalid/suspicious TLDs
  // e.g. "gmail.jjhuhui", "gmail.fhwiif", "yahoo.jjhuhui", etc.
  if (domain.startsWith("gmail.") && tld !== "com") {
    return {
      isValid: false,
      error: "Please check your email domain. Did you mean gmail.com?",
      suggestion: "gmail.com",
      suggestedEmail: `${localPart}@gmail.com`,
      sanitized,
      localPart,
      domain,
    };
  }

  if (domain.startsWith("yahoo.") && tld !== "com" && domain !== "yahoo.com.ph") {
    return {
      isValid: false,
      error: "Please check your email domain. Did you mean yahoo.com?",
      suggestion: "yahoo.com",
      suggestedEmail: `${localPart}@yahoo.com`,
      sanitized,
      localPart,
      domain,
    };
  }

  if (domain.startsWith("outlook.") && tld !== "com" && domain !== "outlook.ph") {
    return {
      isValid: false,
      error: "Please check your email domain. Did you mean outlook.com?",
      suggestion: "outlook.com",
      suggestedEmail: `${localPart}@outlook.com`,
      sanitized,
      localPart,
      domain,
    };
  }

  if (domain.startsWith("hotmail.") && tld !== "com" && domain !== "hotmail.ph") {
    return {
      isValid: false,
      error: "Please check your email domain. Did you mean hotmail.com?",
      suggestion: "hotmail.com",
      suggestedEmail: `${localPart}@hotmail.com`,
      sanitized,
      localPart,
      domain,
    };
  }

  // 3. Comprehensive RFC 5322 regex validation
  const EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  if (!EMAIL_REGEX.test(sanitized)) {
    return {
      isValid: false,
      error: "Please enter a properly formatted email address (e.g. resident@gmail.com).",
      suggestion: null,
      suggestedEmail: null,
      sanitized,
      localPart,
      domain,
    };
  }

  return {
    isValid: true,
    error: null,
    suggestion: null,
    suggestedEmail: null,
    sanitized,
    localPart,
    domain,
  };
}

/**
 * Validates password length and strength.
 * - Minimum 6 characters required (rejects < 6 characters like 'abc12').
 * - Permits longer passwords (does not truncate).
 * - Recommends 12+ characters for security.
 */
export function validatePassword(password: string): {
  isValid: boolean;
  error: string | null;
  isStrong: boolean;
  hint: string | null;
} {
  if (!password) {
    return {
      isValid: false,
      error: "Password is required.",
      isStrong: false,
      hint: null,
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      error: "Password must be at least 6 characters long.",
      isStrong: false,
      hint: null,
    };
  }

  if (password.length < 12) {
    return {
      isValid: true,
      error: null,
      isStrong: false,
      hint: "Meets minimum 6 characters. Tip: 12+ characters recommended for stronger security.",
    };
  }

  return {
    isValid: true,
    error: null,
    isStrong: true,
    hint: "Strong password length.",
  };
}

/**
 * Validates Philippine mobile contact numbers.
 * Accepts formats:
 * - 09XXXXXXXXX (11 digits)
 * - +639XXXXXXXXX (13 characters)
 * - Space/hyphen-separated variants like '0917 123 4567' or '0917-123-4567'
 */
export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  error: string | null;
  formatted: string;
} {
  const sanitized = phone.trim().replace(/[\s-]/g, "");

  if (!sanitized) {
    return {
      isValid: false,
      error: "Contact number is required.",
      formatted: "",
    };
  }

  // 11 digits starting with 09
  if (/^09\d{9}$/.test(sanitized)) {
    return {
      isValid: true,
      error: null,
      formatted: sanitized,
    };
  }

  // International Philippine mobile format +639XXXXXXXXX
  if (/^\+639\d{9}$/.test(sanitized)) {
    return {
      isValid: true,
      error: null,
      formatted: `0${sanitized.slice(3)}`, // Normalize to 09...
    };
  }

  return {
    isValid: false,
    error: "Please enter a valid Philippine mobile number (e.g. 09171234567 or +639171234567).",
    formatted: sanitized,
  };
}
