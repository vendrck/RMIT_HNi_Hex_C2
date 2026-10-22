"use client";

import { useState } from "react";
import { createExamPolicies, encryptExam } from "@/lib/vault/crypto";
import { readableError, readJson, type ExamApi } from "./examApi";

type Status =
  | { kind: "idle" }
  | { kind: "working"; step: string }
  | { kind: "done"; title: string }
  | { kind: "error"; message: string };

// Encrypts in the browser; only ciphertext + signed policies are POSTed.
export function ExamUploadForm({ api }: { api: ExamApi }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = `exam-${crypto.randomUUID()}`;
    try {
      setStatus({ kind: "working", step: "Signing access policies with Tide..." });
      const policies = await createExamPolicies(id);

      setStatus({ kind: "working", step: "Encrypting in your browser..." });
      const ciphertext = await encryptExam(text, id, policies);

      setStatus({ kind: "working", step: "Uploading ciphertext..." });
      await readJson(
        await api("/api/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            title: title.trim(),
            ciphertext,
            writePolicy: policies.writePolicy,
            readPolicy: policies.readPolicy,
          }),
        })
      );

      setText("");
      setStatus({ kind: "done", title: title.trim() });
      setTitle("");
    } catch (err) {
      setStatus({ kind: "error", message: readableError(err) });
    }
  }

  if (status.kind === "done") {
    return (
      <section>
        <h2>Uploaded: {status.title}</h2>
        <p>
          <strong>You can&apos;t read this back.</strong> Your access is write-only. Opening it
          needs the exam-opener role, which takes 2 of 3 committee approvals.
        </p>
        <button onClick={() => setStatus({ kind: "idle" })}>Upload another</button>
      </section>
    );
  }

  const working = status.kind === "working";
  return (
    <form onSubmit={onSubmit}>
      <p>
        <label>
          Title
          <br />
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
        </label>
      </p>
      <p>
        <label>
          Exam text
          <br />
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} cols={70} required />
        </label>
      </p>
      <button type="submit" disabled={working || !title.trim() || !text}>
        Encrypt and upload
      </button>
      {working && <p>{status.step}</p>}
      {status.kind === "error" && <p role="alert">Upload failed: {status.message}</p>}
    </form>
  );
}
