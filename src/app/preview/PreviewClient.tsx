"use client";

import { useMemo, useState } from "react";
import { ExamList } from "@/components/ExamList";
import { ExamUploadForm } from "@/components/ExamUploadForm";
import { GovernanceBanner } from "@/components/GovernanceBanner";
import { ServerViewTable } from "@/components/ServerViewTable";
import { MockGovernance } from "./MockGovernance";
import type { ExamApi } from "@/components/examApi";
import type { ExamRow } from "@/lib/db";

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
  const rows = useMemo(() => new Map<string, ExamRow>(), []);
  const api = useMemo(() => fakeApi(rows, () => setVersion((v) => v + 1)), [rows]);
  // A new function identity makes ExamList reload after an upload.
  const listApi = useMemo<ExamApi>(() => (p, i) => api(p, i), [api, version]);

  return (
    <main>
      <p style={{ background: "#fee", padding: 8 }}>
        SIMULATION: fake in-memory API, mock crypto and a simulated committee. Not the real
        Tide network.
      </p>
      <h1>Upload an exam</h1>
      <ExamUploadForm api={api} />
      <h1>Exams</h1>
      <GovernanceBanner />
      <MockGovernance />
      <ExamList
        api={listApi}
        onSignInAgain={() => alert("The real /exams page signs you out here, so you can sign in again.")}
      />
      <h1>What the operator sees</h1>
      <ServerViewTable rows={[...rows.values()].reverse()} />
    </main>
  );
}
