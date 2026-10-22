"use client";

import Link from "next/link";
import { useState } from "react";
import { createExamPolicies, encryptExam } from "@/lib/vault/crypto";
import { readableError, readJson, type ExamApi } from "./examApi";
import { CheckIcon, ShieldIcon } from "./icons";
import { SIMULATED } from "./simUsers";
import styles from "./vault.module.css";

const STEPS = ["Sign the access policies with Tide", "Encrypt the paper in this browser", "Upload the ciphertext"];

type Status =
  | { kind: "idle" }
  | { kind: "working"; step: number }
  | { kind: "done"; title: string }
  | { kind: "error"; message: string; step: number };

// The mock answers instantly; hold each simulated step briefly so the progress is visible.
const pace = () => (SIMULATED ? new Promise((r) => setTimeout(r, 450)) : Promise.resolve());

// Encrypts in the browser; only ciphertext + signed policies are POSTed.
export function ExamUploadForm({ api }: { api: ExamApi }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = `exam-${crypto.randomUUID()}`;
    let step = 0;
    try {
      setStatus({ kind: "working", step });
      const policies = await createExamPolicies(id);
      await pace();

      setStatus({ kind: "working", step: ++step });
      const ciphertext = await encryptExam(text, id, policies);
      await pace();

      setStatus({ kind: "working", step: ++step });
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
      await pace();

      setText("");
      setStatus({ kind: "done", title: title.trim() });
      setTitle("");
    } catch (err) {
      setStatus({ kind: "error", message: readableError(err), step });
    }
  }

  if (status.kind === "done") {
    return (
      <section className={styles.success} aria-live="polite">
        <span className={`${styles.seal} ${styles.sealLocked}`}>Sealed</span>
        <h2>Uploaded: {status.title}</h2>
        <p>
          <strong>You can&apos;t read this back.</strong> Your access is write-only. Opening it
          needs the exam-opener role, which takes 2 of 3 committee approvals.
        </p>
        <div className={styles.paperActions}>
          <Link href="/exams" className={styles.button}>
            See it in Papers
          </Link>
          <button className={styles.buttonQuiet} onClick={() => setStatus({ kind: "idle" })}>
            Upload another
          </button>
        </div>
      </section>
    );
  }

  const working = status.kind === "working";
  const showSteps = status.kind === "working" || status.kind === "error";
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
          disabled={working}
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
          disabled={working}
          required
        />
      </div>

      {showSteps && (
        <ol className={styles.stepper} aria-label="Upload progress">
          {STEPS.map((label, i) => {
            const done = i < status.step;
            const active = status.kind === "working" && i === status.step;
            return (
              <li
                key={label}
                className={`${styles.step} ${done ? styles.stepDone : ""} ${active ? styles.stepActive : ""}`}
                aria-current={active ? "step" : undefined}
              >
                <span className={styles.stepDot}>{done && <CheckIcon className={styles.sealIcon} />}</span>
                {label}
              </li>
            );
          })}
        </ol>
      )}

      <div className={styles.formActions}>
        <button className={styles.button} type="submit" disabled={working || !title.trim() || !text}>
          {working ? <span className={styles.spinner} aria-hidden /> : <ShieldIcon className={styles.sealIcon} />}
          {working ? "Encrypting..." : "Encrypt and upload"}
        </button>
        <span className={styles.counter}>{text.length.toLocaleString()} characters</span>
      </div>
      {status.kind === "error" && (
        <p className={styles.alert} role="alert">
          <strong>Upload failed.</strong> {status.message}
        </p>
      )}
    </form>
  );
}
