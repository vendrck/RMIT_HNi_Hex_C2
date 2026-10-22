"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AccessDeniedError, decryptExam, OPENER_ROLE } from "@/lib/vault/crypto";
import type { ExamRow, ExamSummary } from "@/lib/db";
import { readableError, readJson, type ExamApi } from "./examApi";
import styles from "./vault.module.css";

type OpenState =
  | { kind: "opening" }
  | { kind: "opened"; text: string }
  | { kind: "denied" }
  | { kind: "error"; message: string };

// One label per exam. A Tide denial stays "Locked": the app can't tell a pending change
// request from no request at all, so it never claims "pending" (the console shows that).
type Badge = "Locked" | "Opened";

function badgeFor(state: OpenState | undefined): Badge {
  return state?.kind === "opened" ? "Opened" : "Locked";
}

const uploadedAt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

// Lists exams (no ciphertext). Open fetches the ciphertext and decrypts in the browser.
// onSignInAgain: offered after a denial, because a newly approved role only reaches the
// token on re-login (or after up to 2 minutes).
export function ExamList({ api, onSignInAgain }: { api: ExamApi; onSignInAgain?: () => void }) {
  const [exams, setExams] = useState<ExamSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, OpenState>>({});

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await readJson<{ exams: ExamSummary[] }>(await api("/api/exams"));
      setExams(data.exams);
    } catch (err) {
      setError(readableError(err));
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function openExam(id: string) {
    setOpen((s) => ({ ...s, [id]: { kind: "opening" } }));
    try {
      const { exam } = await readJson<{ exam: ExamRow }>(await api(`/api/exams/${encodeURIComponent(id)}`));
      const text = await decryptExam(exam.ciphertext, exam.id, {
        writePolicy: exam.write_policy,
        readPolicy: exam.read_policy,
      });
      setOpen((s) => ({ ...s, [id]: { kind: "opened", text } }));
    } catch (err) {
      const next: OpenState =
        err instanceof AccessDeniedError ? { kind: "denied" } : { kind: "error", message: readableError(err) };
      setOpen((s) => ({ ...s, [id]: next }));
    }
  }

  if (error) {
    return (
      <div className={styles.alert} role="alert">
        <strong>Could not load papers.</strong> {error}{" "}
        <button className={styles.buttonQuiet} onClick={load}>
          Retry
        </button>
      </div>
    );
  }
  if (!exams) {
    return (
      <p className={styles.muted} role="status">
        Loading papers...
      </p>
    );
  }
  if (exams.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No papers yet. Uploaded papers appear here, sealed.</p>
        <p>
          <Link href="/upload" className={styles.buttonQuiet}>
            Upload a paper
          </Link>
        </p>
      </div>
    );
  }

  return (
    <ul className={styles.papers}>
      {exams.map((e) => {
        const state = open[e.id];
        const badge = badgeFor(state);
        return (
          <li key={e.id} className={styles.paper}>
            <div className={styles.paperHead}>
              <div>
                <h2 className={styles.paperTitle}>{e.title}</h2>
                <p className={styles.paperMeta}>Uploaded {uploadedAt(e.created_at)}</p>
              </div>
              <span
                className={`${styles.seal} ${badge === "Opened" ? styles.sealOpened : styles.sealLocked}`}
                aria-label={`Status: ${badge}`}
              >
                {badge}
              </span>
            </div>

            {state?.kind === "opened" && <div className={styles.paperBody}>{state.text}</div>}

            {state?.kind === "denied" && (
              <div className={styles.alert} role="alert">
                <strong>Locked: needs 2 of 3 committee approvals.</strong> Denied by the Tide
                network. Opening needs the {OPENER_ROLE} role, granted by 2 of 3 committee approvals.
                If your request was just approved, sign in again (or wait up to 2 minutes).
              </div>
            )}

            {state?.kind !== "opened" && (
              <>
                {state?.kind !== "denied" && (
                  <p className={styles.instruction}>
                    Do not open this paper until 2 of 3 committee members approve.
                  </p>
                )}
                <div className={styles.paperActions}>
                  <button
                    className={styles.button}
                    onClick={() => openExam(e.id)}
                    disabled={state?.kind === "opening"}
                  >
                    {state?.kind === "opening" ? "Asking the Tide network..." : state ? "Try again" : "Open"}
                  </button>
                  {state?.kind === "denied" && onSignInAgain && (
                    <button className={styles.buttonQuiet} onClick={onSignInAgain}>
                      Sign in again
                    </button>
                  )}
                </div>
              </>
            )}
            {state?.kind === "error" && (
              <p className={styles.alert} role="alert">
                <strong>Could not open this paper.</strong> {state.message}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
