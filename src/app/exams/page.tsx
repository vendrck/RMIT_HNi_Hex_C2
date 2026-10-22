"use client";

import { useTideCloak } from "@tidecloak/nextjs";
import { ExamList } from "@/components/ExamList";
import { useExamApi } from "@/components/examApi";
import { GovernanceBanner } from "@/components/GovernanceBanner";

export default function ExamsPage() {
  const api = useExamApi();
  // Re-login puts a newly approved exam-opener role into the token.
  const { logout } = useTideCloak();
  return (
    <main>
      <h1>Exams</h1>
      <p>
        Opening an exam decrypts it in your browser, if the Tide network agrees you may.{" "}
        <a href="/upload">Upload an exam</a>
      </p>
      <GovernanceBanner />
      <ExamList api={api} onSignInAgain={logout} />
    </main>
  );
}
