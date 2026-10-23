"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/error-message";
import { PasswordVisibilityToggle } from "@/components/ui/password-visibility-toggle";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    let timeoutId: number | undefined;

    try {
      const signupRequest = createClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });
      const signupTimeout = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(
          () =>
            reject(
              new Error(
                "Could not connect to Supabase. Check that Docker Desktop is running, then run npm.cmd run db:start from the project folder and try again."
              )
            ),
          10000
        );
      });
      const { data, error } = await Promise.race([signupRequest, signupTimeout]);

      if (error) {
        setMessage(error.message);
      } else if (data.session) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setMessage(
          "Account created. Please confirm your email, then log in to open your dashboard."
        );
      }
    } catch (error) {
      setMessage(
        getSupabaseErrorMessage(error, "Unable to create your account. Please try again.")
      );
    } finally {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f7fb",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "8px",
            color: "#166534",
          }}
        >
          EcoGuard
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "25px",
          }}
        >
          Create your resident account
        </p>

        <form onSubmit={handleRegister}>
          <label>Full Name</label>

          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              marginBottom: "16px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />

          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              marginBottom: "16px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />

          <label htmlFor="register-password">Password</label>

          <div style={{ position: "relative", marginTop: "6px", marginBottom: "20px" }}>
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (!e.target.value) setShowPassword(false);
              }}
              placeholder="Create a password"
              required
              minLength={6}
              style={{
                boxSizing: "border-box",
                width: "100%",
                padding: "12px 76px 12px 12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            />
            {password.length > 0 && (
              <PasswordVisibilityToggle
                visible={showPassword}
                onToggle={() => setShowPassword((visible) => !visible)}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "#166534",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {message && (
          <p
            role="status"
            style={{
              marginTop: "20px",
              textAlign: "center",
              color: message.startsWith("Account created")
                ? "#166534"
                : "#b91c1c",
            }}
          >
            {message}
          </p>
        )}
        <p style={{ marginTop: "18px", textAlign: "center", color: "#666" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#166534", fontWeight: 600 }}>
            Log in
          </Link>
        </p>
        <p style={{ marginTop: "14px", textAlign: "center" }}>
          <Link href="/" style={{ color: "#166534", fontSize: "14px" }}>
            Back to EcoGuard home
          </Link>
        </p>
      </div>
    </main>
  );
}