"use client";

import { useTideCloak } from "@tidecloak/nextjs";
import { useEffect } from "react";
import { AppShell } from "./AppShell";
import styles from "./vault.module.css";

// Same gate as dashboard/layout.tsx. UI gating only: the API verifies JWT + DPoP.
export function RequireLogin({ children }: { children: React.ReactNode }) {
  const { authenticated, isInitializing, initError, login, reload } = useTideCloak();

  useEffect(() => {
    // After a failed init, login() would redirect into a sign-in server that isn't answering.
    if (!isInitializing && !authenticated && !initError) {
      login();
    }
  }, [isInitializing, authenticated, initError, login]);

  if (initError) {
    return (
      <AppShell>
        <div className={styles.alert} role="alert">
          <strong>Can&apos;t reach the sign-in service.</strong> TideCloak did not respond, so you
          can&apos;t sign in yet. Check that TideCloak is running, then try again.
          <div>
            <button className={styles.buttonQuiet} onClick={reload}>
              Try again
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

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
