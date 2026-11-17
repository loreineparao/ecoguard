"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { Check, LoaderCircle } from "lucide-react";

type ProfileFormProps = {
  fullName: string;
};

export default function ProfileForm({ fullName }: ProfileFormProps) {
  const [name, setName] = useState(fullName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Full name is required and cannot be blank.");
      return;
    }

    setLoading(true);

    const result = await updateProfile(trimmed);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Unable to update your profile.");
      return;
    }

    setName(trimmed);
    setMessage(result.message ?? "Your profile has been updated successfully.");
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="settings-full-name">
          Full Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="settings-full-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError("");
          }}
          autoComplete="name"
          disabled={loading}
          required
          aria-invalid={Boolean(error)}
          style={error ? { borderColor: "#DC2626" } : undefined}
        />
        <p className="hint">
          This full name appears on your submitted complaints, permit applications, and dashboard greeting.
        </p>
      </div>

      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="notice success" role="status">
          <Check size={14} style={{ display: "inline-block", marginRight: "6px" }} />
          {message}
        </div>
      )}

      <button
        className="button green"
        type="submit"
        disabled={loading || !name.trim()}
        style={{ width: "fit-content", minWidth: "140px", marginTop: "8px" }}
      >
        {loading ? (
          <LoaderCircle className="spin" size={15} aria-hidden="true" />
        ) : null}
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
