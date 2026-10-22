"use client";

import { useCallback, useEffect, useState } from "react";
import { AccessDeniedError, decryptExam, OPENER_ROLE } from "@/lib/vault/crypto";
import type { ExamRow, ExamSummary } from "@/lib/db";
import { readableError, readJson, type ExamApi } from "./examApi";

type OpenState =
  | { kind: "opening" }
  | { kind: "opened"; text: string }
  | { kind: "denied" }
  | { kind: "error"; message: string };

// One label per exam. "Pending approval" = the Tide network refused: the opener role
// is not (yet) in this user's token. We can't see the change request from here.
type Badge = "Locked" | "Pending approval" | "Opened";
const BADGE_STYLE: Record<Badge, React.CSSProperties> = {
  Locked: { background: "#eee", color: "#333" },
  "Pending approval": { background: "#fff3cd", color: "#664d03" },
  Opened: { background: "#d1e7dd", color: "#0f5132" },
};

function badgeFor(state: OpenState | undefined): Badge {
  if (state?.kind === "opened") return "Opened";
  if (state?.kind === "denied") return "Pending approval";
  return "Locked";
}

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
      <p role="alert">
        Could not load exams. {error} <button onClick={load}>Retry</button>
      </p>
    );
  }
  if (!exams) return <p>Loading exams...</p>;
  if (exams.length === 0) return <p>No exams yet.</p>;

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {exams.map((e) => {
        const state = open[e.id];
        const badge = badgeFor(state);
        return (
          <li key={e.id} style={{ borderBottom: "1px solid #ddd", padding: "8px 0" }}>
            <span style={{ ...BADGE_STYLE[badge], borderRadius: 4, padding: "2px 6px", fontSize: "0.85em" }}>
              {badge}
            </span>{" "}
            <strong>{e.title}</strong> <small>uploaded {new Date(e.created_at).toLocaleString()}</small>{" "}
            {state?.kind !== "opened" && (
              <button onClick={() => openExam(e.id)} disabled={state?.kind === "opening"}>
                {state?.kind === "opening" ? "Asking the Tide network..." : state ? "Try again" : "Open"}
              </button>
            )}
            {state?.kind === "opened" && <pre style={{ whiteSpace: "pre-wrap" }}>{state.text}</pre>}
            {state?.kind === "denied" && (
              <p role="alert">
                Denied by the Tide network. Opening needs the {OPENER_ROLE} role, granted by 2 of 3
                committee approvals. If your request was just approved, sign in again (or wait up to 2
                minutes).{" "}
                {onSignInAgain && <button onClick={onSignInAgain}>Sign in again</button>}
              </p>
            )}
            {state?.kind === "error" && <p role="alert">Could not open this exam. {state.message}</p>}
          </li>
        );
      })}
    </ul>
  );
}
