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
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      setEmail(user.email ?? null);
      setName(user.user_metadata?.full_name || "Resident");
    }
    void loadUser();
    return () => { active = false; };
  }, []);
  return <AppShell mode="resident" userName={name} email={email}>{children}</AppShell>;
}
