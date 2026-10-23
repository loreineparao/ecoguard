"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/error-message";
import { PasswordVisibilityToggle } from "@/components/ui/password-visibility-toggle";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) {
        setIsError(true);
        setMessage(error.message);
        return;
      }

      setMessage("Your password has been updated. Redirecting to your dashboard...");
      window.setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    } catch (error) {
      setIsError(true);
      setMessage(
        getSupabaseErrorMessage(
          error,
          "Unable to update your password. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f8f5] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-[#e0e9e2] bg-white p-7 shadow-[0_20px_60px_-35px_rgba(20,70,45,0.3)] sm:p-9">
        <Link href="/" className="text-sm font-semibold text-[#176b49] hover:underline">
          EcoGuard
        </Link>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#173e30]">Set a new password</h1>
        <p className="mt-2 text-sm leading-6 text-[#718178]">
          Choose a new password for your EcoGuard account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-[#355344]">
              New password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (!event.target.value) setShowPassword(false);
                }}
                className="h-11 w-full rounded-lg border border-[#d9e4dc] px-3.5 pr-16 text-sm outline-none focus:border-[#398661] focus:ring-4 focus:ring-[#e8f4eb]"
              />
              {password.length > 0 && (
                <PasswordVisibilityToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((visible) => !visible)}
                />
              )}
            </div>
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-semibold text-[#355344]">
              Confirm new password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={6}
                required
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (!event.target.value) setShowConfirmPassword(false);
                }}
                className="h-11 w-full rounded-lg border border-[#d9e4dc] px-3.5 pr-16 text-sm outline-none focus:border-[#398661] focus:ring-4 focus:ring-[#e8f4eb]"
              />
              {confirmPassword.length > 0 && (
                <PasswordVisibilityToggle
                  visible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((visible) => !visible)}
                />
              )}
            </div>
          </div>

          {message && (
            <p role="status" className={`rounded-lg px-3.5 py-3 text-sm ${isError ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-[#0c684b] px-4 text-sm font-semibold text-white transition hover:bg-[#09573e] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Updating password..." : "Update password"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#718178]">
          <Link href="/login" className="font-semibold text-[#176b49] hover:underline">
            Back to log in
          </Link>
        </p>
      </section>
    </main>
  );
}
