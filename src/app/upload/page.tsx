"use client";

import { AppShell, PageHead } from "@/components/AppShell";
import { ExamUploadForm } from "@/components/ExamUploadForm";
import { useExamApi } from "@/components/examApi";
import { CheckIcon } from "@/components/icons";
import styles from "@/components/vault.module.css";

export default function UploadPage() {
  const api = useExamApi();
  return (
    <AppShell>
      <PageHead title="Upload a paper">
        The paper is encrypted in your browser and the server stores only ciphertext. Once
        uploaded, you can&apos;t read it back.
      </PageHead>
      <div className={styles.split}>
        <ExamUploadForm api={api} />
        <aside className={styles.rail}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>What happens when you upload</h2>
            <ol className={styles.stepper}>
              <li className={`${styles.step} ${styles.stepDone}`}>
                <span className={styles.stepDot} aria-hidden>
                  <CheckIcon className={styles.sealIcon} />
                </span>
                Two access policies are signed: write-only for you, read for exam-opener.
              </li>
              <li className={`${styles.step} ${styles.stepDone}`}>
                <span className={styles.stepDot} aria-hidden>
                  <CheckIcon className={styles.sealIcon} />
                </span>
                The text is encrypted here, before it leaves this device.
              </li>
              <li className={`${styles.step} ${styles.stepDone}`}>
                <span className={styles.stepDot} aria-hidden>
                  <CheckIcon className={styles.sealIcon} />
                </span>
                Only ciphertext reaches the server.
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
