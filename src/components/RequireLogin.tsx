"use client";

import { useTideCloak } from "@tidecloak/nextjs";
import { useEffect } from "react";
import { AppShell, PageHead } from "./AppShell";
import { SIM_USERS, SIMULATED } from "./simUsers";
import { simSignIn, useSimSession } from "./simulation";
import styles from "./vault.module.css";

// Same gate as dashboard/layout.tsx. UI gating only: the API verifies JWT + DPoP.
export function RequireLogin({ children }: { children: React.ReactNode }) {
  return SIMULATED ? <SimulatedGate>{children}</SimulatedGate> : <TideGate>{children}</TideGate>;
}

function Checking() {
  return (
    <AppShell>
      <div className={styles.gate} role="status">
        <span className={styles.spinner} aria-hidden />
        Checking your sign-in...
      </div>
    </AppShell>
  );
}

function TideGate({ children }: { children: React.ReactNode }) {
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
        <div className={`${styles.card} ${styles.gateCard}`} role="alert">
          <h1 className={styles.cardTitle}>Can&apos;t reach the sign-in service</h1>
          <p className={styles.cardText}>
            TideCloak did not respond, so you can&apos;t sign in yet. Check that TideCloak is running,
            then try again.
          </p>
          <p style={{ margin: "1rem 0 0" }}>
            <button className={styles.button} onClick={reload}>
              Try again
            </button>
          </p>
        </div>
      </AppShell>
    );
  }

  if (isInitializing || !authenticated) return <Checking />;
  return <>{children}</>;
}

// Plan C: stands in for the Tide sign-in while the network can't issue tokens.
function SimulatedGate({ children }: { children: React.ReactNode }) {
  const session = useSimSession();
  if (session === undefined) return <Checking />;
  if (session) return <>{children}</>;
  return (
    <AppShell>
      <section className={styles.signIn} aria-labelledby="sim-sign-in">
        <PageHead title="Sign in">
          Tide sign-in is simulated while the Tide network is under heavy load. Pick who you are;
          each one gets the roles a real Tide token would carry.
        </PageHead>
        <div className={styles.signInGrid} id="sim-sign-in">
          {SIM_USERS.map((u) => (
            <button key={u.id} className={styles.signInOption} onClick={() => simSignIn(u.id)}>
              <span className={styles.avatar} aria-hidden>
                {u.id === "setter" ? "S" : u.name.slice(-1)}
              </span>
              <span>
                <strong>{u.name}</strong>
                <span className={styles.signInBlurb}>{u.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
