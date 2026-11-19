/**
 * EcoGuard Validation Utilities
 * Validates emails, passwords, and form inputs for resident registration and authentication.
 */

/**
 * Validates an email address according to RFC standards and real-world TLD requirements.
 * Rejects incomplete, malformed, or trailing-dot addresses like:
 * - juanamarie@gmail (missing TLD)
 * - resident@gmail. (trailing dot)
 * - resident@ (missing domain)
 * - residentgmail.com (missing @)
 * While accepting valid addresses like resident@gmail.com, juan.delacruz@batstate-u.edu.ph.
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error: string | null;
  sanitized: string;
} {
  const sanitized = email.trim();

  if (!sanitized) {
    return {
      isValid: false,
      error: "Email address is required.",
      sanitized,
    };
  }

  // RFC 5321 length limits
  if (sanitized.length > 254) {
    return {
      isValid: false,
      error: "Email address cannot exceed 254 characters.",
      sanitized,
    };
  }

  // Check for single '@' symbol
  const atParts = sanitized.split("@");
  if (atParts.length !== 2) {
    return {
      isValid: false,
      error: "Please enter a valid email address with a single '@' (e.g. resident@gmail.com).",
      sanitized,
    };
  }

  const [localPart, domain] = atParts;

  // Local part validation
  if (!localPart || localPart.length === 0 || localPart.length > 64) {
    return {
      isValid: false,
      error: "The username portion before '@' is invalid or empty.",
      sanitized,
    };
  }

  // Domain checks
  if (!domain || domain.length === 0) {
    return {
      isValid: false,
      error: "Email is missing a domain after '@' (e.g. gmail.com).",
      sanitized,
    };
  }

  if (domain.startsWith(".") || domain.endsWith(".")) {
    return {
      isValid: false,
      error: "Email domain cannot start or end with a dot (e.g. resident@gmail.com).",
      sanitized,
    };
  }

  if (domain.includes("..")) {
    return {
      isValid: false,
      error: "Email domain cannot contain consecutive dots.",
      sanitized,
    };
  }

  // Ensure domain contains at least one dot separating domain label and TLD
  const domainParts = domain.split(".");
  if (domainParts.length < 2) {
    return {
      isValid: false,
      error: "Email must include a top-level domain (e.g. .com, .org, or .ph).",
      sanitized,
    };
  }

  // The Top-Level Domain (TLD) must be at least 2 alphabetic characters
  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-zA-Z]{2,24}$/.test(tld)) {
    return {
      isValid: false,
      error: "Email domain extension is incomplete or invalid (e.g. .com).",
      sanitized,
    };
  }

  // Comprehensive RFC 5322 regex validation
  const EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  if (!EMAIL_REGEX.test(sanitized)) {
    return {
      isValid: false,
      error: "Please enter a properly formatted email address (e.g. resident@gmail.com).",
      sanitized,
    };
  }

  return {
    isValid: true,
    error: null,
    sanitized,
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
