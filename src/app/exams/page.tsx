"use client";

import { useTideCloak } from "@tidecloak/nextjs";
import { AppShell, PageHead } from "@/components/AppShell";
import { ExamList } from "@/components/ExamList";
import { useExamApi } from "@/components/examApi";
import { GovernanceBanner } from "@/components/GovernanceBanner";

export default function ExamsPage() {
  const api = useExamApi();
  // Re-login puts a newly approved exam-opener role into the token.
  const { logout } = useTideCloak();
  return (
    <AppShell>
      <PageHead title="Papers">
        Opening a paper decrypts it in your browser, only if the Tide network agrees you may.
      </PageHead>
      <GovernanceBanner />
      <ExamList api={api} onSignInAgain={logout} />
    </AppShell>
  );
}
