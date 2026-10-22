"use client";

import { useTideCloak } from "@tidecloak/nextjs";
import { AppShell, PageHead } from "@/components/AppShell";
import { CommitteePanel } from "@/components/CommitteePanel";
import { ExamList } from "@/components/ExamList";
import { useExamApi } from "@/components/examApi";
import { GovernanceBanner } from "@/components/GovernanceBanner";
import { SIMULATED } from "@/components/simUsers";
import { simSignOut } from "@/components/simulation";
import styles from "@/components/vault.module.css";

export default function ExamsPage() {
  const api = useExamApi();
  // Re-login puts a newly approved exam-opener role into the token.
  const { logout } = useTideCloak();
  return (
    <AppShell>
      <PageHead title="Papers">
        Opening a paper decrypts it in your browser, only if the Tide network agrees you may.
      </PageHead>
      <div className={styles.split}>
        <ExamList api={api} onSignInAgain={SIMULATED ? simSignOut : logout} />
        <aside className={styles.rail}>
          <GovernanceBanner />
          {SIMULATED && <CommitteePanel />}
        </aside>
      </div>
    </AppShell>
  );
}
