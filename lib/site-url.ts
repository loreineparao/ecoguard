/**
 * EcoGuard Site URL & Auth Redirect Resolver
 * Municipality of Mabini, Batangas
 *
 * Resolves proper production URLs (https://ecoguardmabini.co) while safely
 * supporting local development on localhost or local area network.
 */

export function getSiteUrl(): string {
  // 1. Explicitly configured Vercel or environment variable
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    let url = process.env.NEXT_PUBLIC_SITE_URL.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    return url.replace(/\/$/, "");
  }

  // 2. Client-side browser runtime: use window.location.origin
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  // 3. Fallback to production domain
  return "https://ecoguardmabini.co";
}

/**
 * Returns an absolute URL for authentication redirects (e.g., signup confirmation, password reset).
 *
 * @param path - Destination path (e.g. "/auth/callback", "/auth/reset-password")
 * @returns Fully qualified absolute URL
 */
export function getAuthRedirectUrl(path: string = "/auth/callback"): string {
  const base = getSiteUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
