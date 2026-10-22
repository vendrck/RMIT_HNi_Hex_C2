"use client";

import { useState } from "react";
import { createExamPolicies, encryptExam } from "@/lib/vault/crypto";
import { readableError, readJson, type ExamApi } from "./examApi";
import styles from "./vault.module.css";

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
      <section className={styles.success} aria-live="polite">
        <h2>Uploaded: {status.title}</h2>
        <p>
          <strong>You can&apos;t read this back.</strong> Your access is write-only. Opening it
          needs the exam-opener role, which takes 2 of 3 committee approvals.
        </p>
        <button className={styles.buttonQuiet} onClick={() => setStatus({ kind: "idle" })}>
          Upload another
        </button>
      </section>
    );
  }

  const working = status.kind === "working";
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="exam-title">
          Title
        </label>
        <input
          id="exam-title"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Final Mathematics Paper 1"
          required
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="exam-text">
          Exam text
        </label>
        <span className={styles.hint} id="exam-text-hint">
          Encrypted on this device before upload. The server never sees it.
        </span>
        <textarea
          id="exam-text"
          className={styles.textarea}
          aria-describedby="exam-text-hint"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          required
        />
      </div>
      <div className={styles.formActions}>
        <button className={styles.button} type="submit" disabled={working || !title.trim() || !text}>
          Encrypt and upload
        </button>
        {working && (
          <p className={styles.progress} role="status">
            {status.step}
          </p>
        )}
      </div>
      {status.kind === "error" && (
        <p className={styles.alert} role="alert">
          <strong>Upload failed.</strong> {status.message}
        </p>
      )}
    </form>
  );
}
