import LandingPage from "@/app/components/landing-page";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dashboardHref: "/dashboard" | "/admin" | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    dashboardHref = profile?.role === "admin" ? "/admin" : "/dashboard";
  }

  return <LandingPage dashboardHref={dashboardHref} />;
}
