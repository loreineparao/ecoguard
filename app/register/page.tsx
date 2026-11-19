"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validateEmail, validatePassword } from "@/lib/validators";
import { validateEmailDomainOnServer } from "@/app/actions/validate-email";
import { getAuthRedirectUrl } from "@/lib/site-url";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation states
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Submission & feedback states
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);
  const [registrationSuccessEmail, setRegistrationSuccessEmail] = useState<string | null>(null);

  // Resend email state & cooldown
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");

  // Handle countdown for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Derived validations
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const isFormValid =
    fullName.trim().length > 0 &&
    emailValidation.isValid &&
    passwordValidation.isValid;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    setMessage("");
    setMessageType("");
    setResendMessage("");

    let hasError = false;

    // Validate Full Name
    if (!fullName.trim()) {
      setFullNameError("Please enter your full name.");
      hasError = true;
    }

    // Validate Email
    if (!emailValidation.isValid) {
      hasError = true;
    }

    // Validate Password
    if (!passwordValidation.isValid) {
      hasError = true;
    }

    if (hasError) {
      setMessage("Please complete all required fields correctly.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = emailValidation.sanitized;
      const cleanName = fullName.trim();

      // Step 1: Server-side email domain & DNS MX verification before touching Supabase Auth
      const domainVerification = await validateEmailDomainOnServer(cleanEmail);
      if (!domainVerification.isValid) {
        setMessage(domainVerification.error || "Please check your email domain.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Configure redirect URL to /auth/confirm
      const redirectUrl = getAuthRedirectUrl("/auth/confirm");

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setMessageType("error");
        setLoading(false);
        return;
      }

      // Supabase returns an empty identities array if user already exists (anti-enumeration)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setMessage(
          "An account with this email address already exists. Please sign in or use 'Forgot password' on the login page."
        );
        setMessageType("error");
        setLoading(false);
        return;
      }

      // Account created successfully
      setRegistrationSuccessEmail(cleanEmail);
      setMessageType("success");
      setMessage(
        `Registration submitted! If this is an active deliverable email address, an activation link has been dispatched to ${cleanEmail}. Please check your inbox (and Spam/Junk folder) to activate your account before signing in.`
      );
      setResendCooldown(60); // 60-second cooldown
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMessage(`Unable to complete registration: ${errMsg}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    const targetEmail = registrationSuccessEmail || emailValidation.sanitized;
    if (!targetEmail || resendCooldown > 0) return;

    setResending(true);
    setResendMessage("");

    try {
      const supabase = createClient();
      const redirectUrl = getAuthRedirectUrl("/auth/confirm");

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        setResendMessage(`Could not resend email: ${error.message}`);
      } else {
        setResendMessage(
          `A new confirmation email has been dispatched to ${targetEmail}. Please check your inbox.`
        );
        setResendCooldown(60);
      }
    } catch {
      setResendMessage("Network issue while requesting confirmation email. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="auth-page">
      <Link href="/" className="auth-back">
        <ArrowLeft size={16} aria-hidden="true" /> Back to EcoGuard
      </Link>

      <section className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <strong className="text-slate-900 dark:text-white" style={{ fontSize: "20px" }}>
            EcoGuard
          </strong>
        </div>

        <div className="auth-heading">
          <p className="eyebrow" style={{ justifyContent: "center" }}>
            Mabini, Batangas
          </p>
          <h1>Create resident account</h1>
          <p>Join the digital environmental service portal.</p>
        </div>

        {registrationSuccessEmail ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
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
              <Mail size={28} aria-hidden="true" />
            </div>

            <h2 style={{ fontSize: "18px", color: "var(--dark-forest)", margin: "0 0 8px", fontWeight: 700 }}>
              Verify your email address
            </h2>

            <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 auto 16px" }}>
              We sent an account activation link to <strong style={{ color: "var(--dark-forest)" }}>{registrationSuccessEmail}</strong>.
              Click the link inside to confirm your registration and access the EcoGuard resident portal.
            </p>

            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "12px 14px",
                fontSize: "12.5px",
                color: "var(--text-secondary)",
                textAlign: "left",
                marginBottom: "20px",
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: "var(--dark-forest)", display: "block", marginBottom: "4px" }}>
                Didn&apos;t receive the email?
              </strong>
              Check your <strong>Spam</strong> or <strong>Junk</strong> folder. Free email providers like Gmail sometimes place automated verification messages there.
            </div>

            {resendMessage && (
              <div
                className={`notice ${resendMessage.includes("dispatched") ? "success" : "error"}`}
                role="status"
                style={{ marginBottom: "16px", fontSize: "12.5px" }}
              >
                {resendMessage}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                className="button secondary"
                onClick={handleResendEmail}
                disabled={resending || resendCooldown > 0}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {resending ? (
                  "Sending..."
                ) : resendCooldown > 0 ? (
                  `Resend email in ${resendCooldown}s`
                ) : (
                  <>
                    <RefreshCw size={14} aria-hidden="true" /> Resend confirmation email
                  </>
                )}
              </button>

              <Link className="button green" href="/login" style={{ width: "100%", justifyContent: "center" }}>
                Proceed to Sign In <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit} noValidate>
            {/* Full Name */}
            <div className="form-field">
              <label htmlFor="full-name">
                Full name <span aria-hidden="true">*</span>
              </label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fullNameError) setFullNameError("");
                }}
                onBlur={() => {
                  if (!fullName.trim()) {
                    setFullNameError("Please enter your full name.");
                  }
                }}
                placeholder="Juan Dela Cruz"
                autoComplete="name"
                required
                disabled={loading}
                aria-invalid={!!fullNameError}
                aria-describedby={fullNameError ? "full-name-error" : undefined}
                style={fullNameError ? { borderColor: "#DC2626" } : undefined}
              />
              {fullNameError && (
                <p id="full-name-error" className="field-error-text" role="alert">
                  <AlertCircle size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                  {fullNameError}
                </p>
              )}
            </div>

            {/* Email Address with Validation */}
            <div className="form-field">
              <label htmlFor="register-email">
                Email address <span aria-hidden="true">*</span>
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!emailTouched) setEmailTouched(true);
                }}
                onBlur={() => setEmailTouched(true)}
                placeholder="resident@gmail.com"
                autoComplete="email"
                required
                disabled={loading}
                aria-invalid={emailTouched && !emailValidation.isValid}
                aria-describedby={emailTouched && emailValidation.error ? "email-error" : undefined}
                style={
                  emailTouched && !emailValidation.isValid
                    ? { borderColor: "#DC2626" }
                    : undefined
                }
              />
              {emailTouched && !emailValidation.isValid && (
                <div id="email-error" className="field-error-text" role="alert" style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                  <p style={{ margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                    <AlertCircle size={13} style={{ flexShrink: 0 }} />
                    <span>{emailValidation.error}</span>
                  </p>
                  {emailValidation.suggestedEmail && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(emailValidation.suggestedEmail!);
                        setEmailTouched(true);
                      }}
                      className="suggestion-chip"
                      style={{
                        alignSelf: "flex-start",
                        background: "rgba(5, 150, 105, 0.12)",
                        border: "1px solid rgba(5, 150, 105, 0.4)",
                        borderRadius: "6px",
                        color: "#059669",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Use {emailValidation.suggestion}
                    </button>
                  )}
                </div>
              )}
              {emailTouched && email.length > 0 && emailValidation.isValid && (
                <p className="field-success-text" style={{ marginTop: "4px" }}>
                  <CheckCircle2 size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                  Valid email syntax
                </p>
              )}
            </div>

            {/* Password with Show/Hide Toggle & Validation */}
            <div className="form-field">
              <label htmlFor="register-password">
                Password <span aria-hidden="true">*</span>
              </label>
              <div className="password-input-wrap">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (!passwordTouched) setPasswordTouched(true);
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  aria-invalid={passwordTouched && !passwordValidation.isValid}
                  aria-describedby={
                    passwordTouched && passwordValidation.error ? "password-error" : "password-hint"
                  }
                  style={
                    passwordTouched && !passwordValidation.isValid
                      ? { borderColor: "#DC2626" }
                      : undefined
                  }
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <Eye size={18} aria-hidden="true" />
                  ) : (
                    <EyeOff size={18} aria-hidden="true" />
                  )}
                </button>
              </div>

              {passwordTouched && !passwordValidation.isValid && (
                <p id="password-error" className="field-error-text" role="alert">
                  <AlertCircle size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                  {passwordValidation.error}
                </p>
              )}

              {password.length > 0 && passwordValidation.isValid && (
                <p id="password-hint" className={passwordValidation.isStrong ? "field-success-text" : "field-hint-text"}>
                  <CheckCircle2 size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                  {passwordValidation.hint}
                </p>
              )}
            </div>

            <button
              className="button green auth-submit"
              type="submit"
              disabled={loading || (emailTouched && !isFormValid)}
            >
              {loading ? "Creating account..." : "Create resident account"}
              {!loading && <ArrowRight size={16} aria-hidden="true" />}
            </button>

            {message && (
              <div
                className={`notice ${messageType === "success" ? "success" : "error"}`}
                role="alert"
              >
                {message}
              </div>
            )}
          </form>
        )}

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
