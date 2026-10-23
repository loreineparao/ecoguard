export function getSupabaseErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (
    error.message.includes("URL and API key are required") ||
    error.message.includes("URL and Key are required")
  ) {
    return "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart the app.";
  }

  return error.message;
}
