"use server";

import dns from "dns";
import { validateEmail, type EmailValidationResult } from "@/lib/validators";

export type ServerEmailValidationResult = {
  isValid: boolean;
  error: string | null;
  suggestion: string | null;
  suggestedEmail: string | null;
  sanitized: string;
  checkedMx: boolean;
};

// Known major domains with verified MX records (fast-path to avoid unnecessary network latency)
const KNOWN_VERIFIED_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "yahoo.com.ph",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "msn.com",
  "aol.com",
]);

/**
 * Configure reliable DNS nameservers for server-side resolution
 */
function getDnsResolver() {
  const resolver = new dns.promises.Resolver();
  try {
    // Primary: Google DNS & Cloudflare DNS fallbacks to ensure reliability across all hosting environments
    resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  } catch {
    // Fall back to system default resolvers
  }
  return resolver;
}

/**
 * Performs server-side email validation:
 * 1. Syntax, formatting, whitespace, and character restrictions.
 * 2. Typo detection and correction suggestion for common providers.
 * 3. DNS MX record resolution to ensure the domain actually exists and is configured to receive email.
 *
 * NOTE: DNS MX verification confirms that the destination domain has active mail exchange servers.
 * It is domain-level routing evidence only and does not prove that a specific mailbox exists.
 */
export async function validateEmailDomainOnServer(
  email: string
): Promise<ServerEmailValidationResult> {
  // Step 1: Base validation (syntax, length, formatting, and typo dictionary)
  const baseResult: EmailValidationResult = validateEmail(email);

  if (!baseResult.isValid) {
    return {
      isValid: false,
      error: baseResult.error,
      suggestion: baseResult.suggestion,
      suggestedEmail: baseResult.suggestedEmail,
      sanitized: baseResult.sanitized,
      checkedMx: false,
    };
  }

  const domain = baseResult.domain;
  if (!domain) {
    return {
      isValid: false,
      error: "Unable to parse email domain.",
      suggestion: null,
      suggestedEmail: null,
      sanitized: baseResult.sanitized,
      checkedMx: false,
    };
  }

  // Step 2: Fast-path for verified top providers (avoids DNS latency on standard Gmail, Yahoo, Outlook, etc.)
  if (KNOWN_VERIFIED_DOMAINS.has(domain)) {
    return {
      isValid: true,
      error: null,
      suggestion: null,
      suggestedEmail: null,
      sanitized: baseResult.sanitized,
      checkedMx: false,
    };
  }

  // Step 3: DNS MX resolution for school (.edu.ph), government (.gov.ph), custom, and organization domains
  try {
    const resolver = getDnsResolver();

    // Set a strict 3.5 second timeout so user registration never hangs
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DNS_TIMEOUT")), 3500)
    );

    const mxPromise = resolver.resolveMx(domain);

    const mxRecords = await Promise.race([mxPromise, timeoutPromise]);

    if (Array.isArray(mxRecords) && mxRecords.length > 0) {
      return {
        isValid: true,
        error: null,
        suggestion: null,
        suggestedEmail: null,
        sanitized: baseResult.sanitized,
        checkedMx: true,
      };
    }

    // Step 4: RFC 5321 fallback - check if domain has a valid IPv4 address (A record) that can accept mail
    try {
      const aRecords = await resolver.resolve4(domain);
      if (Array.isArray(aRecords) && aRecords.length > 0) {
        return {
          isValid: true,
          error: null,
          suggestion: null,
          suggestedEmail: null,
          sanitized: baseResult.sanitized,
          checkedMx: true,
        };
      }
    } catch {
      // No A record fallback
    }

    return {
      isValid: false,
      error: `The email domain "${domain}" does not appear to have active mail servers. Please check your email for typos.`,
      suggestion: null,
      suggestedEmail: null,
      sanitized: baseResult.sanitized,
      checkedMx: true,
    };
  } catch (err: unknown) {
    const dnsError = err as { code?: string; message?: string };

    if (dnsError.code === "ENOTFOUND" || dnsError.code === "ENODATA") {
      return {
        isValid: false,
        error: `The email domain "${domain}" does not exist. Please check your email address.`,
        suggestion: null,
        suggestedEmail: null,
        sanitized: baseResult.sanitized,
        checkedMx: true,
      };
    }

    // On network timeout or transient DNS lookup error, gracefully accept valid syntax
    // to avoid blocking legitimate registrations during ISP or transient network issues
    return {
      isValid: true,
      error: null,
      suggestion: null,
      suggestedEmail: null,
      sanitized: baseResult.sanitized,
      checkedMx: false,
    };
  }
}
