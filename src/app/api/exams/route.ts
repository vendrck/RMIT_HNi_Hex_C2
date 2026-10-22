import { withExamAuth } from "./simulatedAuth";
import { insertExam, getExam, listExams } from "@/lib/db";
import { isCiphertext } from "./ciphertextShape";

// The server only ever sees ciphertext + signed policies. Anything that could be
// plaintext is rejected here, before it reaches the DB.

const MOCK = process.env.NEXT_PUBLIC_MOCK_TIDE === "1";
const ALLOWED_KEYS = new Set(["id", "title", "ciphertext", "writePolicy", "readPolicy"]);
const EXAM_ID = /^exam-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_TITLE = 200;

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export const POST = withExamAuth(async (req, jwt) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Body must be a JSON object" }, { status: 400 });
  }

  const extra = Object.keys(body).filter((k) => !ALLOWED_KEYS.has(k));
  if (extra.length) {
    return Response.json({ error: `Unexpected fields: ${extra.join(", ")}` }, { status: 400 });
  }

  const { id, title, ciphertext, writePolicy, readPolicy } = body;
  if (typeof id !== "string" || !EXAM_ID.test(id)) {
    return Response.json({ error: "id must be exam-<uuid>" }, { status: 400 });
  }
  if (!nonEmpty(title) || title.length > MAX_TITLE) {
    return Response.json({ error: `title must be 1-${MAX_TITLE} characters` }, { status: 400 });
  }
  if (typeof ciphertext !== "string" || !isCiphertext(ciphertext, MOCK)) {
    return Response.json({ error: "ciphertext is not ciphertext-shaped" }, { status: 400 });
  }
  if (!nonEmpty(writePolicy) || !nonEmpty(readPolicy)) {
    return Response.json({ error: "writePolicy and readPolicy are required" }, { status: 400 });
  }
  if (!jwt.sub) {
    return Response.json({ error: "Token has no sub" }, { status: 401 });
  }
  if (getExam(id)) {
    return Response.json({ error: "Exam id already exists" }, { status: 409 });
  }

  const row = insertExam({
    id,
    title: title.trim(),
    ciphertext,
    write_policy: writePolicy,
    read_policy: readPolicy,
    created_by: jwt.sub,
  });
  return Response.json({ id: row.id, created_at: row.created_at }, { status: 201 });
});

// List view: no ciphertext.
export const GET = withExamAuth(async () => {
  return Response.json({ exams: listExams() });
});
