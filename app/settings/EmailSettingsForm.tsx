"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/validators";
import { getAuthRedirectUrl } from "@/lib/site-url";
import { Mail, Check, AlertCircle, LoaderCircle, Send } from "lucide-react";

type EmailSettingsFormProps = {
  currentEmail: string;
};

export default function EmailSettingsForm({
  currentEmail,
}: EmailSettingsFormProps) {
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingNotice, setPendingNotice] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  async function handleEmailUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPendingNotice("");

    const emailValidation = validateEmail(newEmail);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || "Please enter a valid email address.");
      return;
    }

    const cleanNewEmail = emailValidation.sanitized.toLowerCase();
    if (cleanNewEmail === currentEmail.toLowerCase()) {
      setError("Your new email must be different from your current registered email address.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const redirectUrl = getAuthRedirectUrl("/auth/callback");

      const { error: updateError } = await supabase.auth.updateUser(
        { email: cleanNewEmail },
        { emailRedirectTo: redirectUrl }
      );

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setPendingNotice(
        `A verification email has been sent to ${cleanNewEmail}. Please open your inbox and click the confirmation link to complete your email address update.`
      );
      setNewEmail("");
      setIsChanging(false);
    } catch {
      setError("An unexpected error occurred while requesting an email update. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="settings-section-card">
      <div className="settings-section-header">
        <div className="settings-section-icon">
          <Mail size={18} aria-hidden="true" />
        </div>
        <div>
          <h3>Registered Email Address</h3>
          <p className="hint">
            Your login email address and primary contact for official municipal notifications.
          </p>
        </div>
      </div>

      <div className="current-email-display">
        <span className="current-email-tag">Current Email:</span>
        <strong className="current-email-val">{currentEmail}</strong>
      </div>

      {pendingNotice && (
        <div className="notice success" role="status" style={{ marginTop: "12px" }}>
          <Check size={15} style={{ display: "inline-block", marginRight: "6px" }} />
          {pendingNotice}
        </div>
      )}

      {!isChanging ? (
        <div style={{ marginTop: "14px" }}>
          <button
            type="button"
            className="button secondary sm"
            onClick={() => {
              setIsChanging(true);
              setError("");
            }}
          >
            Change Email Address
          </button>
        </div>
      ) : (
        <form onSubmit={handleEmailUpdate} className="settings-subform" noValidate>
          <div className="form-field" style={{ marginTop: "14px" }}>
            <label htmlFor="new-email-input">
              New Email Address <span aria-hidden="true">*</span>
            </label>
            <input
              id="new-email-input"
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. newresident@gmail.com"
              autoComplete="email"
              disabled={loading}
              required
              aria-invalid={Boolean(error)}
              style={error ? { borderColor: "#DC2626" } : undefined}
            />
            {error && (
              <p className="field-error-text" role="alert">
                <AlertCircle size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                {error}
              </p>
            )}
            <p className="hint">
              Security notice: Per Supabase security policy, a confirmation link will be delivered to complete the email verification.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            <button
              className="button green sm"
              type="submit"
              disabled={loading || !newEmail.trim()}
            >
              {loading ? (
                <LoaderCircle className="spin" size={14} aria-hidden="true" />
              ) : (
                <Send size={14} aria-hidden="true" />
              )}
              {loading ? "Sending link..." : "Send Verification Link"}
            </button>

            <button
              type="button"
              className="button secondary sm"
              onClick={() => {
                setIsChanging(false);
                setNewEmail("");
                setError("");
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
