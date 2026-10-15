"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    window.location.assign("/in/login");
  };
  return <button className="button" type="button" onClick={signOut}>Sign out</button>;
}
