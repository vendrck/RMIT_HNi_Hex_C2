"use client";

import { useTideCloak } from "@tidecloak/nextjs";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { LockIcon, UnlockIcon } from "@/components/icons";
import { SIMULATED } from "@/components/simUsers";
import styles from "@/components/vault.module.css";

// Public home page. No auth required.
export default function HomePage() {
  const { authenticated, login, initError } = useTideCloak();

  return (
    <AppShell>
      <section className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>No one opens an exam alone.</h1>
          <p className={styles.heroLede}>
            Exam Vault seals each paper in the setter&apos;s browser. The server only ever holds
            ciphertext, and a paper opens only after 2 of 3 committee members approve.
          </p>
          <div className={styles.heroCtas}>
            {SIMULATED || authenticated ? (
              <Link href="/exams" className={styles.buttonLarge}>
                {SIMULATED ? "Try the demo" : "Go to papers"}
              </Link>
            ) : (
              <button className={styles.buttonLarge} onClick={login} disabled={!!initError}>
                Sign in with Tide
              </button>
            )}
            <Link href="/server-view" className={styles.buttonQuiet}>
              See what the server stores
            </Link>
          </div>
          <p className={styles.heroNote}>
            {SIMULATED
              ? "Sign-in, roles and approvals are simulated while the Tide network is under heavy load."
              : initError
                ? "The sign-in service isn't responding. Check that TideCloak is running."
                : "Secured by TideCloak: the decryption key never exists in one place."}
          </p>
        </div>

        <HeroIllustration />
      </section>

      <h2 className={styles.howTitle}>How a paper opens</h2>
      <ol className={styles.how}>
        <li>
          <h3>Seal</h3>
          <p>The setter encrypts the paper in their browser. They can&apos;t read it back.</p>
        </li>
        <li>
          <h3>Request</h3>
          <p>An admin asks for the exam-opener role. That becomes a change request.</p>
        </li>
        <li>
          <h3>Approve</h3>
          <p>Two of three committee members approve. The requester can&apos;t vote twice.</p>
        </li>
        <li>
          <h3>Open</h3>
          <p>The Tide network releases the key only to the role holder, in their browser.</p>
        </li>
      </ol>

      <h2 className={styles.howTitle}>Who can&apos;t open it alone</h2>
      <ul className={styles.nobody}>
        <li>
          <strong>The setter</strong>
          <span>Their access is write-only from the moment they upload.</span>
        </li>
        <li>
          <strong>An IT admin</strong>
          <span>Granting themselves the role needs a second admin&apos;s approval.</span>
        </li>
        <li>
          <strong>The server operator</strong>
          <span>The database holds ciphertext and signed policies, nothing readable.</span>
        </li>
        <li>
          <strong>Us, the vendor</strong>
          <span>The key is held by the Tide network, never by our servers.</span>
        </li>
      </ul>
    </AppShell>
  );
}

// One orchestrated sequence: the paper arrives sealed, two committee members approve, the seal opens.
function HeroIllustration() {
  return (
    <div className={styles.illus} aria-hidden>
      <div className={styles.illusPaper}>
        <div className={styles.illusSeal}>
          <span className={styles.illusLocked}>
            <LockIcon className={styles.sealIcon} /> Locked
          </span>
          <span className={styles.illusOpened}>
            <UnlockIcon className={styles.sealIcon} /> Opened
          </span>
        </div>
        <p className={styles.illusTitle}>Final Mathematics Paper 1</p>
        <div className={styles.illusLine} style={{ width: "62%" }} />
        <div className={styles.illusLine} style={{ width: "48%" }} />
        <div className={styles.illusBox}>Do not open this paper until 2 of 3 committee members approve.</div>
        <div className={styles.illusLine} style={{ width: "90%", marginTop: "1rem" }} />
        <div className={styles.illusLine} style={{ width: "76%" }} />
      </div>
      <div className={styles.illusCommittee}>
        <div className={styles.illusMembers}>
          <span className={`${styles.illusMember} ${styles.illusVote1}`}>A1</span>
          <span className={`${styles.illusMember} ${styles.illusVote2}`}>A2</span>
          <span className={styles.illusMember}>A3</span>
          <span className={styles.illusMeterLabel}>Committee approvals</span>
        </div>
        <div className={styles.illusMeter}>
          <span />
        </div>
      </div>
    </div>
  );
}
