"use client";

import { useEffect, useState, type ReactNode } from "react";
import AppShell from "./app-shell";
import { createClient } from "@/lib/supabase/client";

export default function ResidentFrame({ children }: { children: ReactNode }) {
  const [name, setName] = useState("Resident");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user) return;

      setEmail(user.email ?? null);
      const fallbackName = user.user_metadata?.full_name || "Resident";
      setName(fallbackName);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      if (profile?.full_name) {
        setName(profile.full_name);
      }
      if (profile?.email) {
        setEmail(profile.email);
      }
    }
    void loadUser();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell mode="resident" userName={name} email={email}>
      {children}
    </AppShell>
  );
}
