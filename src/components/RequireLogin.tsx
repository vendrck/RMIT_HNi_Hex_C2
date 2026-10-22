"use client";

import { useTideCloak } from "@tidecloak/nextjs";
import { useEffect } from "react";

// Same gate as dashboard/layout.tsx. UI gating only: the API verifies JWT + DPoP.
export function RequireLogin({ children }: { children: React.ReactNode }) {
  const { authenticated, isInitializing, login } = useTideCloak();

  useEffect(() => {
    if (!isInitializing && !authenticated) {
      login();
    }
  }, [isInitializing, authenticated, login]);

  if (isInitializing || !authenticated) {
    return <p>Checking authentication...</p>;
  }

  return <>{children}</>;
}
