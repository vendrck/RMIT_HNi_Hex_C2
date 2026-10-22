"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHead } from "@/components/AppShell";
import { ExamList } from "@/components/ExamList";
import { ExamUploadForm } from "@/components/ExamUploadForm";
import { GovernanceBanner } from "@/components/GovernanceBanner";
import { ServerViewTable } from "@/components/ServerViewTable";
import type { ExamApi } from "@/components/examApi";
import type { ExamRow } from "@/lib/db";
import styles from "@/components/vault.module.css";

// DEV ONLY. Renders the real components without login. The API is an in-memory fake
// (lost on reload) that answers like /api/exams; crypto.ts runs in mock mode.
function fakeApi(rows: Map<string, ExamRow>, onChange: () => void): ExamApi {
  return async (path, init) => {
    const method = (init?.method ?? "GET").toUpperCase();
    if (path === "/api/exams" && method === "POST") {
      const b = JSON.parse(String(init?.body));
      rows.set(b.id, {
        id: b.id,
        title: b.title,
        ciphertext: b.ciphertext,
        write_policy: b.writePolicy,
        read_policy: b.readPolicy,
        created_by: "preview-user",
        created_at: new Date().toISOString(),
      });
      onChange();
      return Response.json({ id: b.id }, { status: 201 });
    }
    if (path === "/api/exams") {
      const exams = [...rows.values()].reverse().map(({ ciphertext: _c, ...summary }) => summary);
      return Response.json({ exams });
    }
    const exam = rows.get(decodeURIComponent(path.split("/").pop() ?? ""));
    return exam ? Response.json({ exam }) : Response.json({ error: "Not found" }, { status: 404 });
  };
}

export function PreviewClient() {
  const [version, setVersion] = useState(0);
  const [denied, setDenied] = useState(false);
  const rows = useMemo(() => new Map<string, ExamRow>(), []);
  const api = useMemo(() => fakeApi(rows, () => setVersion((v) => v + 1)), [rows]);
  // A new function identity makes ExamList reload after an upload.
  const listApi = useMemo<ExamApi>(() => (p, i) => api(p, i), [api, version]);

  useEffect(() => {
    try {
      setDenied(localStorage.getItem("mockDenied") === "1");
    } catch {}
  }, []);

  function toggleDenied() {
    const next = !denied;
    try {
      localStorage.setItem("mockDenied", next ? "1" : "0");
    } catch {}
    setDenied(next);
  }

  return (
    <AppShell
      devNote={
        <>
          <span>Dev preview: fake in-memory API, mock crypto. Not the real app.</span>
          <label>
            <input type="checkbox" checked={denied} onChange={toggleDenied} /> Simulate Tide denial
          </label>
        </>
      }
    >
      <PageHead title="Upload a paper" />
      <ExamUploadForm api={api} />
      <h2 className={styles.sectionTitle}>Papers</h2>
      <GovernanceBanner />
      <ExamList
        api={listApi}
        onSignInAgain={() => alert("The real /exams page signs you out here, so you can sign in again.")}
      />
      <h2 className={styles.sectionTitle}>What the operator sees</h2>
      <ServerViewTable rows={[...rows.values()].reverse()} />
    </AppShell>
  );
}
