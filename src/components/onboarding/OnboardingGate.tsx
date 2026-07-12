"use client";

// ─────────────────────────────────────────────────────────────
// Onboarding gate
//
// Lightweight wrapper mounted once in the root layout. Fetches
// the current user's onboarding_completed flag on mount and only
// then renders the OnboardingFlow when needed. Missing profile
// column (migration not yet applied) simply short-circuits so
// the app keeps working during rollout.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { OnboardingFlow } from "./OnboardingFlow";

export function OnboardingGate() {
  const [userId, setUserId] = useState<string | null>(null);
  const [needs, setNeeds] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      // If the column doesn't exist yet (migration not run), pretend
      // onboarding is done so the flow never gates the app.
      if (error) return;

      if (data && data.onboarding_completed === false) {
        setUserId(user.id);
        setNeeds(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <AnimatePresence>
      {needs && userId && (
        <OnboardingFlow
          userId={userId}
          onDone={() => setNeeds(false)}
        />
      )}
    </AnimatePresence>
  );
}
