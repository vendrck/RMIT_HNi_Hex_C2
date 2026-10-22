// The seam between the app (Person B) and Tide (Person A).
// Pages and components call ONLY these functions. Keep the signatures stable.
//
// NEXT_PUBLIC_MOCK_TIDE=1 turns the mock on. The mock is NOT encryption — base64 only —
// and must be off for the demo and the submission.
//
// Browser only: every real call needs the logged-in user's Tide enclave.

import tcConfig from "../../../data/tidecloak.json";

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

// Loaded lazily so the mock path never pulls the Tide SDK into a page.
const tide = () => import("@/lib/tide/relationship");
const iam = async () => (await import("@tidecloak/js")).IAMService;

const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function fetchAdminPolicy(): Promise<Uint8Array> {
  const res = await (await iam()).secureFetch("/api/admin-policy");
  if (!res.ok) throw new Error(`admin policy: ${res.status} ${(await res.json().catch(() => ({}))).error ?? ""}`);
  const { policy } = (await res.json()) as { policy: string };
  return fromBase64(policy);
}

/** Admin's browser: signs both policies for a new exam (opens the Tide enclave twice). */
export async function createExamPolicies(examId: string): Promise<ExamPolicies> {
  if (MOCK) return { writePolicy: `mock-write-${examId}`, readPolicy: `mock-read-${examId}` };

  const { readSession, signRelationshipPolicy } = await tide();
  const { tideUserKey } = readSession();
  if (!tideUserKey) throw new Error("No tideuserkey in your session: sign out and in again");

  const vendorId = (tcConfig as { vendorId?: string }).vendorId;
  if (!vendorId) throw new Error("data/tidecloak.json has no vendorId: re-export the adapter");

  const adminPolicy = await fetchAdminPolicy();
  // The uploader may write this exam and nothing else: they cannot read it back.
  const writePolicy = await signRelationshipPolicy(
    { vendorId, subject: { type: "User", id: tideUserKey }, recordId: examId, access: "write" },
    adminPolicy
  );
  // Anyone holding exam-opener may read it. Granting that role is a 2-of-3 change request.
  const readPolicy = await signRelationshipPolicy(
    { vendorId, subject: { type: "Role", id: OPENER_ROLE }, recordId: examId, access: "read" },
    adminPolicy
  );
  return { writePolicy, readPolicy };
}

/** Uploader's browser: returns ciphertext. The server only ever receives this. */
export async function encryptExam(plaintext: string, examId: string, policies: ExamPolicies): Promise<string> {
  if (MOCK) return `MOCK:${btoa(unescape(encodeURIComponent(plaintext)))}`;
  const { encryptForRecord } = await tide();
  try {
    return await encryptForRecord(plaintext, examId, policies.writePolicy);
  } catch (err) {
    throw asAccessDenied(err);
  }
}

/** Opener's browser: returns plaintext, or throws AccessDeniedError. */
export async function decryptExam(ciphertext: string, examId: string, policies: ExamPolicies): Promise<string> {
  if (MOCK) {
    if (localStorage.getItem("mockDenied") === "1") throw new AccessDeniedError("Denied by the Tide network (mock)");
    return decodeURIComponent(escape(atob(ciphertext.replace(/^MOCK:/, ""))));
  }
  const { decryptForRecord } = await tide();
  try {
    return await decryptForRecord(ciphertext, examId, policies.readPolicy);
  } catch (err) {
    throw asAccessDenied(err);
  }
}

// A contract refusal arrives as TIDE-TIDEJS-NET-THRESHOLD_FAILURE ("Could not reach enough VVK
// ORKs"). It is not an outage: every ORK answered no, and the reason is in `cause`.
const CONTRACT_REFUSALS = [
  "not found in doken",
  "not found for this",
  "not found in list of roles",
  "subjectId does not match",
  "Tags do not contain assignmentId",
  "must be tagged",
  "THRESHOLD_FAILURE",
];

function asAccessDenied(err: unknown): Error {
  const text = describe(err);
  if (CONTRACT_REFUSALS.some((s) => text.includes(s))) {
    return new AccessDeniedError(`Denied by the Tide network: ${text}`);
  }
  return err instanceof Error ? err : new Error(text);
}

function describe(err: unknown): string {
  const parts: string[] = [];
  let e: unknown = err;
  for (let i = 0; e && i < 5; i++) {
    parts.push(e instanceof Error ? e.message : String(e));
    e = e instanceof Error ? (e as Error & { cause?: unknown }).cause : undefined;
  }
  return parts.join(" | ");
}
