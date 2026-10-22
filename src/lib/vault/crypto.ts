// The seam between the app (Person B) and Tide (Person A).
// Pages and components call ONLY these functions. Person B builds against the mock;
// Person A replaces the bodies with relationship.ts calls. Keep the signatures stable.
//
// NEXT_PUBLIC_MOCK_TIDE=1 turns the mock on. The mock is NOT encryption — base64 only —
// and must be off for the demo and the submission.

export const OPENER_ROLE = "exam-opener";

export interface ExamPolicies {
  /** Signed base64 policy: User = uploader, access "write" (write-only drop box). */
  writePolicy: string;
  /** Signed base64 policy: Role = exam-opener, access "read". */
  readPolicy: string;
}

/** Thrown when the Tide network refuses (contract said no). Show it; do not retry. */
export class AccessDeniedError extends Error {}

const MOCK = process.env.NEXT_PUBLIC_MOCK_TIDE === "1";

/** Admin's browser: signs both policies for a new exam (opens the Tide enclave twice). */
export async function createExamPolicies(examId: string): Promise<ExamPolicies> {
  if (MOCK) return { writePolicy: `mock-write-${examId}`, readPolicy: `mock-read-${examId}` };
  // TODO(Person A): signRelationshipPolicy x2 with the admin policy from /api/admin-policy
  throw new Error("createExamPolicies: not wired to Tide yet");
}

/** Uploader's browser: returns ciphertext. The server only ever receives this. */
export async function encryptExam(plaintext: string, examId: string, policies: ExamPolicies): Promise<string> {
  if (MOCK) return `MOCK:${btoa(unescape(encodeURIComponent(plaintext)))}`;
  // TODO(Person A): encryptForRecord(plaintext, examId, policies.writePolicy)
  throw new Error("encryptExam: not wired to Tide yet");
}

/** Opener's browser: returns plaintext, or throws AccessDeniedError. */
export async function decryptExam(ciphertext: string, examId: string, policies: ExamPolicies): Promise<string> {
  if (MOCK) {
    if (localStorage.getItem("mockDenied") === "1") throw new AccessDeniedError("Denied by the Tide network (mock)");
    return decodeURIComponent(escape(atob(ciphertext.replace(/^MOCK:/, ""))));
  }
  // TODO(Person A): decryptForRecord(...); map contract refusals (error.cause) to AccessDeniedError
  throw new Error("decryptExam: not wired to Tide yet");
}
