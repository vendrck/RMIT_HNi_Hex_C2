"use client";

import { useTideCloak } from "@tidecloak/nextjs";
import { useEffect } from "react";
import { AppShell } from "./AppShell";
import styles from "./vault.module.css";

// Same gate as dashboard/layout.tsx. UI gating only: the API verifies JWT + DPoP.
export function RequireLogin({ children }: { children: React.ReactNode }) {
  const { authenticated, isInitializing, login } = useTideCloak();

  useEffect(() => {
    if (!isInitializing && !authenticated) {
      login();
    }
  }, [isInitializing, authenticated, login]);

  if (isInitializing || !authenticated) {
    return (
      <AppShell>
        <p className={styles.gate} role="status">
          Checking your sign-in...
        </p>
      </AppShell>
    );
  }

  return <>{children}</>;
}
