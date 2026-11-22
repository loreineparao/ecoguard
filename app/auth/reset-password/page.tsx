"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/validators";

function ResetPasswordForm() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [success, setSuccess] = useState(false);

  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch =
    confirmPassword.length === 0 || newPassword === confirmPassword;

  // Check if an authenticated recovery session exists
  useEffect(() => {
    const supabase = createClient();

    // 1. Check existing session and verify account is not deactivated
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const isBanned = Boolean(user.banned_until && new Date(user.banned_until) > new Date());
        const isDeactivated = user.app_metadata?.account_status === "deactivated";

        if (isBanned || isDeactivated) {
          setMessage("Your EcoGuard account has been deactivated. Please visit the MENR Office for further assistance.");
          setMessageType("error");
          setHasValidSession(false);
          setCheckingSession(false);
          supabase.auth.signOut();
          return;
        }

        setHasValidSession(true);
      }
      setCheckingSession(false);
    });

    // 2. Listen to Supabase auth state change for PASSWORD_RECOVERY event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        if (session?.user) {
          const isBanned = Boolean(session.user.banned_until && new Date(session.user.banned_until) > new Date());
          const isDeactivated = session.user.app_metadata?.account_status === "deactivated";

          if (isBanned || isDeactivated) {
            setMessage("Your EcoGuard account has been deactivated. Please visit the MENR Office for further assistance.");
            setMessageType("error");
            setHasValidSession(false);
            setCheckingSession(false);
            await supabase.auth.signOut();
            return;
          }
        }
        setHasValidSession(true);
        setCheckingSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setMessage("");
    setMessageType("");

    if (!passwordValidation.isValid) {
      setMessage(
        passwordValidation.error || "Password must be at least 6 characters long."
      );
      setMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match. Please re-enter your password.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const isBanned = Boolean(user?.banned_until && new Date(user.banned_until) > new Date());
      const isDeactivated = user?.app_metadata?.account_status === "deactivated";

      if (!user || isBanned || isDeactivated) {
        setMessage(
          "Your EcoGuard account has been deactivated. Please visit the MENR Office for further assistance."
        );
        setMessageType("error");
        setLoading(false);
        await supabase.auth.signOut();
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage(error.message);
        setMessageType("error");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setMessage(
        "Your password has been reset successfully! Redirecting you to sign in..."
      );
      setMessageType("success");

      // Sign out recovery session so user can log in freshly
      await supabase.auth.signOut();

      // Navigate to login page
      setTimeout(() => {
        router.push("/login?message=password_reset_success");
      }, 2000);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "An unexpected network error occurred.";
      setMessage(`Unable to reset password: ${errMsg}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  // 1. Initial verification loading state
  if (checkingSession) {
    return (
      <main className="auth-page">
        <section className="auth-card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#E8F5E9",
              color: "var(--primary-green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <KeyRound size={24} aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: "18px", color: "var(--dark-forest)", margin: "0 0 8px" }}>
            Validating reset session...
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
            Verifying your secure password recovery token with EcoGuard.
          </p>
        </section>
      </main>
    );
  }

  // 2. Expired, invalid, or missing session
  if (!hasValidSession && !success) {
    return (
      <main className="auth-page">
        <Link href="/login" className="auth-back">
          <ArrowLeft size={16} aria-hidden="true" /> Back to Sign In
        </Link>

        <section className="auth-card">
          <div className="auth-brand">
            <span className="brand-mark">
              <ShieldCheck size={22} aria-hidden="true" />
            </span>
            <strong style={{ fontSize: "20px", color: "var(--dark-forest)" }}>
              EcoGuard
            </strong>
          </div>

          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#FEF2F2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <AlertCircle size={28} aria-hidden="true" />
            </div>

            <h1 style={{ fontSize: "20px", color: "var(--dark-forest)", margin: "0 0 8px", fontWeight: 700 }}>
              Reset link expired or invalid
            </h1>

            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 24px" }}>
              This password recovery link has either expired, has already been used, or was opened without a valid session. Password reset links can only be used once for security.
            </p>

            <Link
              href="/login"
              className="button green"
              style={{ display: "inline-flex", justifyContent: "center", width: "100%", padding: "12px 20px" }}
            >
              Request a new password reset link
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // 3. Success state
  if (success) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-brand">
            <span className="brand-mark">
              <ShieldCheck size={22} aria-hidden="true" />
            </span>
            <strong style={{ fontSize: "20px", color: "var(--dark-forest)" }}>
              EcoGuard
            </strong>
          </div>

          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#E8F5E9",
                color: "var(--primary-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CheckCircle2 size={32} aria-hidden="true" />
            </div>

            <h1 style={{ fontSize: "20px", color: "var(--dark-forest)", margin: "0 0 8px", fontWeight: 700 }}>
              Password Reset Complete!
            </h1>

            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 24px" }}>
              Your EcoGuard account password has been updated successfully. You will be redirected to the sign-in page in a moment.
            </p>

            <Link
              href="/login?message=password_reset_success"
              className="button green"
              style={{ display: "inline-flex", justifyContent: "center", width: "100%", padding: "12px 20px" }}
            >
              Sign in with new password <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // 4. Form state (valid session)
  return (
    <main className="auth-page">
      <Link href="/login" className="auth-back">
        <ArrowLeft size={16} aria-hidden="true" /> Back to Sign In
      </Link>

      <section className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <strong style={{ fontSize: "20px", color: "var(--dark-forest)" }}>
            EcoGuard
          </strong>
        </div>

        <div className="auth-heading">
          <p className="eyebrow" style={{ justifyContent: "center" }}>
            Mabini, Batangas
          </p>
          <h1>Set new password</h1>
          <p>Choose a secure password for your EcoGuard resident account.</p>
        </div>

        {message && (
          <div
            className={`auth-alert ${messageType}`}
            role="alert"
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "13.5px",
              background: messageType === "error" ? "#FEF2F2" : "#E8F5E9",
              color: messageType === "error" ? "#B91C1C" : "#1B5E20",
              border: `1px solid ${messageType === "error" ? "#FCA5A5" : "#A5D6A7"}`,
            }}
          >
            {message}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="form-field">
            <label htmlFor="new-password">
              New Password <span aria-hidden="true">*</span>
            </label>
            <div className="password-input-wrap">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (!newPasswordTouched) setNewPasswordTouched(true);
                }}
                onBlur={() => setNewPasswordTouched(true)}
                placeholder="At least 6 characters"
                minLength={6}
                autoComplete="new-password"
                required
                disabled={loading}
                aria-invalid={newPasswordTouched && !passwordValidation.isValid}
                aria-describedby={
                  newPasswordTouched && passwordValidation.error
                    ? "new-password-error"
                    : "new-password-hint"
                }
                style={
                  newPasswordTouched &&
                  !passwordValidation.isValid &&
                  newPassword.length > 0
                    ? { borderColor: "#DC2626" }
                    : undefined
                }
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
                title={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
                  <Eye size={18} aria-hidden="true" />
                ) : (
                  <EyeOff size={18} aria-hidden="true" />
                )}
              </button>
            </div>

            {newPasswordTouched &&
              newPassword.length > 0 &&
              !passwordValidation.isValid && (
                <p
                  id="new-password-error"
                  className="field-error-text"
                  role="alert"
                >
                  {passwordValidation.error}
                </p>
              )}

            {newPassword.length > 0 && passwordValidation.isValid && (
              <p
                id="new-password-hint"
                className={
                  passwordValidation.isStrong
                    ? "field-success-text"
                    : "field-hint-text"
                }
              >
                {passwordValidation.hint}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-field">
            <label htmlFor="confirm-password">
              Confirm New Password <span aria-hidden="true">*</span>
            </label>
            <div className="password-input-wrap">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (!confirmPasswordTouched) setConfirmPasswordTouched(true);
                }}
                onBlur={() => setConfirmPasswordTouched(true)}
                placeholder="Re-enter your new password"
                minLength={6}
                autoComplete="new-password"
                required
                disabled={loading}
                aria-invalid={confirmPasswordTouched && !passwordsMatch}
                style={
                  confirmPasswordTouched &&
                  !passwordsMatch &&
                  confirmPassword.length > 0
                    ? { borderColor: "#DC2626" }
                    : undefined
                }
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <Eye size={18} aria-hidden="true" />
                ) : (
                  <EyeOff size={18} aria-hidden="true" />
                )}
              </button>
            </div>

            {confirmPasswordTouched &&
              confirmPassword.length > 0 &&
              !passwordsMatch && (
                <p className="field-error-text" role="alert">
                  Passwords do not match.
                </p>
              )}
          </div>

          <button
            className="button green auth-submit"
            type="submit"
            disabled={
              loading ||
              !passwordValidation.isValid ||
              newPassword !== confirmPassword
            }
          >
            {loading ? "Updating password..." : "Update Password"}
            {!loading && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-page">
          <section className="auth-card" style={{ textAlign: "center", padding: "40px 24px" }}>
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          </section>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
