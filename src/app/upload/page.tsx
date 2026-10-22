"use client";

import { ExamUploadForm } from "@/components/ExamUploadForm";
import { useExamApi } from "@/components/examApi";

export default function UploadPage() {
  const api = useExamApi();
  return (
    <main>
      <h1>Upload an exam</h1>
      <p>
        The exam is encrypted in your browser. The server only stores ciphertext, and you
        won&apos;t be able to read it back. <a href="/exams">All exams</a>
      </p>
      <ExamUploadForm api={api} />
    </main>
  );
}
