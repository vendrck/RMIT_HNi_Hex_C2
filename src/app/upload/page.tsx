"use client";

import { AppShell, PageHead } from "@/components/AppShell";
import { ExamUploadForm } from "@/components/ExamUploadForm";
import { useExamApi } from "@/components/examApi";

export default function UploadPage() {
  const api = useExamApi();
  return (
    <AppShell>
      <PageHead title="Upload a paper">
        The paper is encrypted in your browser and the server stores only ciphertext. Once
        uploaded, you can&apos;t read it back.
      </PageHead>
      <ExamUploadForm api={api} />
    </AppShell>
  );
}
