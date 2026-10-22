"use client";

import { useCallback, useEffect, useState } from "react";
import { AccessDeniedError, decryptExam } from "@/lib/vault/crypto";
import type { ExamRow, ExamSummary } from "@/lib/db";
import { readJson, type ExamApi } from "./examApi";

type OpenState =
  | { kind: "opening" }
  | { kind: "opened"; text: string }
  | { kind: "denied"; message: string }
  | { kind: "error"; message: string };

// Lists exams (no ciphertext). Open fetches the ciphertext and decrypts in the browser.
export function ExamList({ api }: { api: ExamApi }) {
  const [exams, setExams] = useState<ExamSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, OpenState>>({});

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await readJson<{ exams: ExamSummary[] }>(await api("/api/exams"));
      setExams(data.exams);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
      const message = err instanceof Error ? err.message : String(err);
      const next: OpenState =
        err instanceof AccessDeniedError ? { kind: "denied", message } : { kind: "error", message };
      setOpen((s) => ({ ...s, [id]: next }));
    }
  }

  if (error) {
    return (
      <p role="alert">
        Could not load exams: {error} <button onClick={load}>Retry</button>
      </p>
    );
  }
  if (!exams) return <p>Loading exams...</p>;
  if (exams.length === 0) return <p>No exams yet.</p>;

  return (
    <ul>
      {exams.map((e) => {
        const state = open[e.id];
        return (
          <li key={e.id}>
            <strong>{e.title}</strong> <small>uploaded {new Date(e.created_at).toLocaleString()}</small>{" "}
            <button onClick={() => openExam(e.id)} disabled={state?.kind === "opening"}>
              {state?.kind === "opening" ? "Asking the Tide network..." : "Open"}
            </button>
            {state?.kind === "opened" && <pre>{state.text}</pre>}
            {state?.kind === "denied" && <p role="alert">Denied by the Tide network.</p>}
            {state?.kind === "error" && <p role="alert">Could not open: {state.message}</p>}
          </li>
        );
      })}
    </ul>
  );
}
